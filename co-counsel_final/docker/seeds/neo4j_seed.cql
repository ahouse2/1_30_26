// Simple seed data for local testing
CREATE (alice:Person {name: 'Alice'})-[:WROTE]->(doc:Document {title: 'Seed Document', id: 'DOC-001', created: date()})
RETURN alice, doc
