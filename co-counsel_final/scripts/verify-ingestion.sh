#!/usr/bin/env bash
set -euo pipefail

PASSWORD="neo4j"
if docker exec cocounsel_neo4j printenv NEO4J_PASSWORD >/dev/null 2>&1; then
  PASSWORD=$(docker exec cocounsel_neo4j printenv NEO4J_PASSWORD)
fi

echo "Verifying Neo4j ingestion state..."
echo "Neo4j user password: ********"

DOC_COUNT=$(docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" -a bolt://localhost:7687 "MATCH (d:Document) RETURN count(d) as c" | tail -n +2 | tr -d ' ')
EDGE_COUNT=$(docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" -a bolt://localhost:7687 "MATCH ()-[r]->() RETURN count(r) as c" | tail -n +2 | tr -d ' ')
NODE_COUNT=$(docker exec cocounsel_neo4j cypher-shell -u neo4j -p "$PASSWORD" -a bolt://localhost:7687 "MATCH (n) RETURN count(n) as c" | tail -n +2 | tr -d ' ')

echo "Documents: $DOC_COUNT"
echo "Nodes: $NODE_COUNT"
echo "Edges: $EDGE_COUNT"

SUMMARY=$(cat <<JSON
{
  "neo4j_documents": ${DOC_COUNT:-0},
  "neo4j_nodes": ${NODE_COUNT:-0},
  "neo4j_edges": ${EDGE_COUNT:-0}
}
JSON
)
echo "$SUMMARY"

exit 0
