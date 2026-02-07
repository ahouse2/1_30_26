import re
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Sequence

from pydantic import BaseModel, Field

# External libraries for blockchain interaction
try:
    from web3 import Web3
    from web3.exceptions import TransactionNotFound
except ImportError:
    Web3 = None
    TransactionNotFound = None

try:
    import bitcoinlib
    from bitcoinlib.keys import Address as BitcoinAddress
    from bitcoinlib.services.services import Service as BitcoinService
except ImportError:
    bitcoinlib = None
    BitcoinAddress = None
    BitcoinService = None

import requests

from backend.app.config import get_settings
from backend.app.services.graph import GraphService
from backend.app.forensics.bridge_registry import BridgeRegistry
from backend.app.forensics.crypto_heuristics import match_bridge_transfers
from backend.app.forensics.crypto_models import AddressRef, ChainRef, ClusterResult, ProvenanceRecord

class WalletAddress(BaseModel):
    address: str
    blockchain: str
    currency: str
    is_valid: bool = False # Added validation status

class Transaction(BaseModel):
    tx_id: str
    sender: str
    receiver: str
    amount: float
    currency: str
    timestamp: str
    blockchain: str
    # Add more fields as needed for detailed transaction data

class CryptoTracingResult(BaseModel):
    wallets_found: List[WalletAddress] = Field(default_factory=list)
    transactions_traced: List[Transaction] = Field(default_factory=list)
    clusters: List[ClusterResult] = Field(default_factory=list)
    bridge_matches: List[Dict[str, Any]] = Field(default_factory=list)
    visual_graph_mermaid: Optional[str] = Field(None, description="Mermaid diagram definition for the transaction graph.")
    details: str = Field(..., description="Summary of the crypto tracing analysis.")

class CryptoTracer:
    """
    Identifies, extracts, and traces cryptocurrency wallet addresses and transactions.
    Integrates with real blockchain APIs and Neo4j for data storage and graph generation.
    """
    def __init__(self, graph_service: GraphService | None = None, enable_graph: bool = True):
        settings = get_settings()
        self.graph_service = graph_service
        self.enable_graph = enable_graph
        if self.graph_service is None and self.enable_graph:
            try:
                self.graph_service = GraphService()
            except Exception:
                self.graph_service = None
        self.ethereum_api_key = settings.blockchain_api_key_ethereum
        self.ethereum_api_base = settings.blockchain_api_base_ethereum or "https://mainnet.infura.io/v3/"
        self.bitcoin_api_key = settings.blockchain_api_key_bitcoin
        self.bitcoin_api_base = settings.blockchain_api_base_bitcoin # Not directly used by bitcoinlib, but good to have

        if Web3 and self.ethereum_api_key:
            self.w3 = Web3(Web3.HTTPProvider(f"{self.ethereum_api_base}{self.ethereum_api_key}"))
            if not self.w3.is_connected():
                print("Warning: Could not connect to Ethereum network via web3.py.")
                self.w3 = None
        else:
            self.w3 = None
            if self.ethereum_api_key:
                print("Warning: web3.py not installed, cannot connect to Ethereum.")

        if bitcoinlib:
            # bitcoinlib typically uses its own service providers,
            # but we can configure it if needed or use direct API calls.
            pass
        else:
            print("Warning: bitcoinlib not installed, cannot process Bitcoin addresses robustly.")

        self._chain_id_map = {
            "ethereum": 1,
            "arbitrum": 42161,
            "optimism": 10,
            "base": 8453,
            "polygon": 137,
            "bitcoin": 0,
        }

    def trace_document_for_crypto(self, document_content: str, document_id: str) -> CryptoTracingResult:
        """
        Scans document content for crypto wallet addresses, performs on-chain analysis,
        stores data in Neo4j, and generates a Mermaid graph.
        """
        wallets = self._extract_wallet_addresses(document_content)
        transactions = []
        clusters: List[ClusterResult] = []
        bridge_matches: List[Dict[str, Any]] = []
        
        if wallets:
            transactions = self._perform_on_chain_analysis(wallets)
            clusters = self._build_clusters(wallets, transactions)
            bridge_matches = self._build_bridge_matches(transactions)
            if self.graph_service and self.enable_graph:
                self._upsert_graph(document_id, wallets, transactions, clusters, bridge_matches)
        
        mermaid_graph = self._generate_graph_data(document_id, wallets, transactions)

        details = f"Found {len(wallets)} potential wallet addresses."
        if transactions:
            details += f" Traced {len(transactions)} transactions."
        if clusters:
            details += f" Built {len(clusters)} clusters."
        if not wallets and not transactions:
            details = "No cryptocurrency activity detected."

        return CryptoTracingResult(
            wallets_found=wallets,
            transactions_traced=transactions,
            clusters=clusters,
            bridge_matches=bridge_matches,
            visual_graph_mermaid=mermaid_graph,
            details=details,
        )

    def _extract_wallet_addresses(self, text: str) -> List[WalletAddress]:
        found_wallets: List[WalletAddress] = []

        # Ethereum address pattern
        eth_pattern = r'\b0x[a-fA-F0-9]{40}\b'
        for match in re.finditer(eth_pattern, text):
            address = match.group(0)
            is_valid = self.w3.is_address(address) if self.w3 else True
            found_wallets.append(WalletAddress(address=address, blockchain="Ethereum", currency="ETH", is_valid=is_valid))

        # Bitcoin address patterns (P2PKH, P2SH, Bech32)
        # Simplified regex for common Bitcoin addresses, more robust validation with bitcoinlib
        btc_pattern = r'\b([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})\b'
        for match in re.finditer(btc_pattern, text):
            address = match.group(0)
            is_valid = True
            if BitcoinAddress:
                try:
                    # Attempt to parse and validate with bitcoinlib
                    btc_address = BitcoinAddress.parse(address)
                    is_valid = btc_address.is_valid()
                except Exception:
                    is_valid = False
            found_wallets.append(WalletAddress(address=address, blockchain="Bitcoin", currency="BTC", is_valid=is_valid))

        return found_wallets

    def _perform_on_chain_analysis(self, wallets: List[WalletAddress]) -> List[Transaction]:
        traced_transactions: List[Transaction] = []
        for wallet in wallets:
            if not wallet.is_valid:
                continue # Skip invalid addresses

            if wallet.blockchain == "Ethereum":
                # Use Etherscan API for transaction history (more efficient than iterating blocks)
                # Requires Etherscan API key, which can be obtained from Etherscan website
                if self.ethereum_api_key:
                    etherscan_url = f"https://api.etherscan.io/api?module=account&action=txlist&address={wallet.address}&startblock=0&endblock=99999999&sort=asc&apikey={self.ethereum_api_key}"
                    try:
                        response = requests.get(etherscan_url)
                        response.raise_for_status()
                        data = response.json()
                        if data["status"] == "1" and data["result"]:
                            for tx_data in data["result"]:
                                raw_value = int(tx_data["value"])
                                amount = float(raw_value) / 10**18
                                if self.w3:
                                    amount = float(self.w3.from_wei(raw_value, 'ether'))
                                traced_transactions.append(Transaction(
                                    tx_id=tx_data["hash"],
                                    sender=tx_data["from"],
                                    receiver=tx_data["to"],
                                    amount=amount,
                                    currency="ETH",
                                    timestamp=datetime.fromtimestamp(int(tx_data["timeStamp"])).isoformat(),
                                    blockchain="Ethereum",
                                ))
                    except requests.exceptions.RequestException as e:
                        print(f"Error fetching Ethereum transactions from Etherscan for {wallet.address}: {e}")
                    token_url = (
                        "https://api.etherscan.io/api?module=account&action=tokentx"
                        f"&address={wallet.address}&startblock=0&endblock=99999999&sort=asc"
                        f"&apikey={self.ethereum_api_key}"
                    )
                    try:
                        token_response = requests.get(token_url)
                        token_response.raise_for_status()
                        token_data = token_response.json()
                        if token_data.get("status") == "1" and token_data.get("result"):
                            for tx_data in token_data["result"]:
                                decimals = int(tx_data.get("tokenDecimal") or 0)
                                raw_value = int(tx_data.get("value") or 0)
                                amount = raw_value / (10 ** decimals) if decimals else float(raw_value)
                                traced_transactions.append(
                                    Transaction(
                                        tx_id=tx_data["hash"],
                                        sender=tx_data["from"],
                                        receiver=tx_data["to"],
                                        amount=amount,
                                        currency=tx_data.get("tokenSymbol") or "TOKEN",
                                        timestamp=datetime.fromtimestamp(int(tx_data["timeStamp"])).isoformat(),
                                        blockchain="Ethereum",
                                    )
                                )
                    except requests.exceptions.RequestException as e:
                        print(f"Error fetching Ethereum token transfers from Etherscan for {wallet.address}: {e}")
                else:
                    print(f"Warning: Etherscan API key not configured for Ethereum. Skipping on-chain analysis for {wallet.address}.")

            elif wallet.blockchain == "Bitcoin" and bitcoinlib:
                # Use Blockchair API for Bitcoin transactions
                # Blockchair API is generally public for basic queries, but rate limits apply
                blockchair_url = f"https://api.blockchair.com/bitcoin/dashboards/address/{wallet.address}"
                try:
                    response = requests.get(blockchair_url)
                    response.raise_for_status()
                    data = response.json()
                    if data["data"] and wallet.address in data["data"]:
                        address_data = data["data"][wallet.address]
                        if "transactions" in address_data:
                            for tx_id in address_data["transactions"]:
                                # Fetch individual transaction details if needed, or use summary
                                # For simplicity, we'll just add a placeholder transaction for now
                                # A full implementation would fetch details for each tx_id
                                traced_transactions.append(Transaction(
                                    tx_id=tx_id,
                                    sender="unknown", # Requires fetching full tx details
                                    receiver="unknown", # Requires fetching full tx details
                                    amount=0.0, # Requires fetching full tx details
                                    currency="BTC",
                                    timestamp=datetime.now().isoformat(), # Placeholder
                                    blockchain="Bitcoin",
                                ))
                except requests.exceptions.RequestException as e:
                    print(f"Error fetching Bitcoin transactions from Blockchair for {wallet.address}: {e}")
            else:
                print(f"Warning: Skipping on-chain analysis for {wallet.address} due to missing library or invalid blockchain.")

        return traced_transactions

    def _build_clusters(self, wallets: List[WalletAddress], transactions: List[Transaction]) -> List[ClusterResult]:
        wallet_map = {wallet.address: wallet for wallet in wallets}
        adjacency: Dict[str, set] = defaultdict(set)
        for tx in transactions:
            if tx.sender and tx.receiver:
                adjacency[tx.sender].add(tx.receiver)
                adjacency[tx.receiver].add(tx.sender)

        clusters: List[ClusterResult] = []
        visited: set = set()
        cluster_index = 0
        for wallet in wallets:
            if wallet.address in visited:
                continue
            queue = [wallet.address]
            component = []
            while queue:
                current = queue.pop()
                if current in visited:
                    continue
                visited.add(current)
                component.append(current)
                for neighbor in adjacency.get(current, set()):
                    if neighbor not in visited:
                        queue.append(neighbor)
            if not component:
                continue
            cluster_index += 1
            addresses = [
                AddressRef(
                    address=address,
                    chain=self._chain_ref(wallet_map.get(address)),
                    labels=["extracted"],
                )
                for address in component
                if address in wallet_map
            ]
            provenance = [
                ProvenanceRecord(
                    source="on_chain" if len(component) > 1 else "document",
                    method="tx_graph_component" if len(component) > 1 else "address_extraction",
                    confidence=0.65 if len(component) > 1 else 0.45,
                    details={"member_count": len(component)},
                )
            ]
            clusters.append(
                ClusterResult(
                    cluster_id=f"cluster-{cluster_index}",
                    addresses=addresses,
                    provenance=provenance,
                )
            )
        return clusters

    def _build_bridge_matches(self, transactions: List[Transaction]) -> List[Dict[str, Any]]:
        if not transactions:
            return []
        grouped: Dict[str, List[dict]] = defaultdict(list)
        for tx in transactions:
            grouped[tx.blockchain].append(
                {
                    "amount": tx.amount,
                    "token": tx.currency,
                    "timestamp": self._coerce_timestamp(tx.timestamp),
                }
            )
        if len(grouped) < 2:
            return []
        registry = BridgeRegistry()
        chains = list(grouped.keys())
        matches: List[Dict[str, Any]] = []
        source_chain = chains[0]
        for destination_chain in chains[1:]:
            matches.extend(
                match_bridge_transfers(
                    registry,
                    source_transfers=grouped[source_chain],
                    dest_transfers=grouped[destination_chain],
                )
            )
        return matches

    def _upsert_graph(
        self,
        document_id: str,
        wallets: List[WalletAddress],
        transactions: List[Transaction],
        clusters: List[ClusterResult],
        bridge_matches: List[Dict[str, Any]],
    ) -> None:
        if not self.graph_service:
            return
        self.graph_service.upsert_document(document_id, title=f"Document {document_id}", metadata={})
        for wallet in wallets:
            wallet_id = self._wallet_node_id(wallet)
            self.graph_service.upsert_entity(wallet_id, "Wallet", {
                "address": wallet.address,
                "blockchain": wallet.blockchain,
                "currency": wallet.currency,
                "is_valid": wallet.is_valid,
            })
            self.graph_service.merge_relation(document_id, "MENTIONS_WALLET", wallet_id, {"source": "document"})
        for tx in transactions:
            tx_id = self._tx_node_id(tx)
            self.graph_service.upsert_entity(tx_id, "Transaction", {
                "tx_id": tx.tx_id,
                "amount": tx.amount,
                "currency": tx.currency,
                "timestamp": tx.timestamp,
                "blockchain": tx.blockchain,
            })
            sender_id = self._wallet_node_id(WalletAddress(
                address=tx.sender,
                blockchain=tx.blockchain,
                currency=tx.currency,
                is_valid=True,
            ))
            receiver_id = self._wallet_node_id(WalletAddress(
                address=tx.receiver,
                blockchain=tx.blockchain,
                currency=tx.currency,
                is_valid=True,
            ))
            self.graph_service.upsert_entity(sender_id, "Wallet", {"address": tx.sender, "blockchain": tx.blockchain})
            self.graph_service.upsert_entity(receiver_id, "Wallet", {"address": tx.receiver, "blockchain": tx.blockchain})
            self.graph_service.merge_relation(sender_id, "SENT", tx_id, {"source": "on_chain"})
            self.graph_service.merge_relation(tx_id, "RECEIVED", receiver_id, {"source": "on_chain"})
        for cluster in clusters:
            cluster_id = f"cluster::{cluster.cluster_id}"
            self.graph_service.upsert_entity(cluster_id, "CryptoCluster", {
                "cluster_id": cluster.cluster_id,
                "member_count": len(cluster.addresses),
            })
            for address in cluster.addresses:
                wallet_id = self._wallet_node_id_from_address(address)
                self.graph_service.merge_relation(cluster_id, "CLUSTER_MEMBER", wallet_id, {"source": "heuristic"})
        if bridge_matches:
            for match in bridge_matches:
                bridge_id = f"bridge::{match.get('bridge') or 'unknown'}"
                self.graph_service.upsert_entity(bridge_id, "Bridge", {"name": match.get("bridge")})

    def _generate_graph_data(
        self,
        document_id: str,
        wallets: Sequence[WalletAddress],
        transactions: Sequence[Transaction],
    ) -> Optional[str]:
        nodes: Dict[str, str] = {}
        edges: set = set()
        if document_id:
            nodes[document_id] = f'Document_{document_id}[Document: {document_id}]'
        for wallet in wallets:
            nodes[wallet.address] = f'Wallet_{wallet.address}[Wallet: {wallet.address}\\n({wallet.blockchain})]'
            if document_id:
                edges.add(f'Document_{document_id} --> Wallet_{wallet.address}')
        for tx in transactions:
            if tx.sender not in nodes:
                nodes[tx.sender] = f'Wallet_{tx.sender}[Wallet: {tx.sender}\\n({tx.blockchain})]'
            if tx.receiver not in nodes:
                nodes[tx.receiver] = f'Wallet_{tx.receiver}[Wallet: {tx.receiver}\\n({tx.blockchain})]'
            nodes[tx.tx_id] = f'Transaction_{tx.tx_id}[Transaction: {tx.tx_id}\\n({tx.amount} {tx.currency})]'
            edges.add(f'Wallet_{tx.sender} --> Transaction_{tx.tx_id}')
            edges.add(f'Transaction_{tx.tx_id} --> Wallet_{tx.receiver}')
        if not nodes:
            return None
        mermaid_definition = "graph TD\\n"
        for node_def in nodes.values():
            mermaid_definition += f"  {node_def}\\n"
        for edge in edges:
            mermaid_definition += f"  {edge}\\n"
        return mermaid_definition

    def _chain_ref(self, wallet: WalletAddress | None) -> ChainRef:
        if wallet is None:
            return ChainRef(chain_id=0, name="unknown", family="evm")
        name = wallet.blockchain.lower()
        family = "evm" if name not in {"bitcoin"} else "utxo"
        return ChainRef(chain_id=self._chain_id_map.get(name, 0), name=name, family=family)

    def _wallet_node_id(self, wallet: WalletAddress) -> str:
        chain = wallet.blockchain.lower()
        return f"wallet::{chain}::{wallet.address}"

    def _wallet_node_id_from_address(self, address: AddressRef) -> str:
        return f"wallet::{address.chain.name}::{address.address}"

    def _tx_node_id(self, tx: Transaction) -> str:
        chain = tx.blockchain.lower()
        return f"tx::{chain}::{tx.tx_id}"

    def _coerce_timestamp(self, timestamp_value: str) -> int:
        try:
            return int(datetime.fromisoformat(timestamp_value).replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            return 0

def get_crypto_tracer() -> CryptoTracer:
    """
    Dependency function to provide a CryptoTracer instance.
    """
    return CryptoTracer()
