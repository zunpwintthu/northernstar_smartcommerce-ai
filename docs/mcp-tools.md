# MCP tools

The standalone service exposes structured read tools under `/tools/*`: product search, stock checks, order lookup, low-stock products, confirmed sales, payment instructions and delivery methods. Every call requires `X-User-Role`; business tools restrict roles and responses omit customer contact details and internal credentials. Successful calls write an audit record.

The HTTP interface makes the security boundary easy to inspect and test. A transport adapter can register the same handlers with the official MCP Python SDK without moving database logic into the language-model process.
