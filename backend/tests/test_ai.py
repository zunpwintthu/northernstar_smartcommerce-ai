from app.ai.graph import classify_intent

def test_intent_routes():
    assert classify_intent("Which products are low stock?")=="low_stock_reporting"
    assert classify_intent("What are this month's sales?")=="sales_reporting"
    assert classify_intent("Show me blue products")=="product_search"

