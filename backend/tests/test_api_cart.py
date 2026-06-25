from fastapi.testclient import TestClient

from app.main import app
from app.repositories.catalog import catalog_repository


def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post("/api/v1/auth/telegram", json={"initData": ""})
    assert response.status_code == 200
    token = response.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


def test_create_user_and_add_update_delete_cart_item() -> None:
    product_id = catalog_repository.search("", page=1, limit=1, in_stock_only=True)[0][0].id
    with TestClient(app) as client:
        headers = auth_headers(client)
        client.delete("/api/v1/cart", headers=headers)
        add = client.post("/api/v1/cart/items", json={"productId": product_id, "quantity": 1}, headers=headers)
        assert add.status_code == 200
        add_again = client.post("/api/v1/cart/items", json={"productId": product_id, "quantity": 1}, headers=headers)
        assert add_again.status_code == 200
        assert len(add_again.json()["items"]) == 1
        assert add_again.json()["items"][0]["quantity"] >= 2

        update = client.patch(f"/api/v1/cart/items/{product_id}", json={"quantity": 3}, headers=headers)
        assert update.status_code == 200
        assert update.json()["items"][0]["quantity"] == 3

        delete = client.delete(f"/api/v1/cart/items/{product_id}", headers=headers)
        assert delete.status_code == 200
        assert delete.json()["items"] == []


def test_cart_comparison_endpoint() -> None:
    product_ids = [item.id for item in catalog_repository.search("", page=1, limit=2, in_stock_only=True)[0]]
    with TestClient(app) as client:
        headers = auth_headers(client)
        client.delete("/api/v1/cart", headers=headers)
        for product_id in product_ids:
            client.post("/api/v1/cart/items", json={"productId": product_id, "quantity": 1}, headers=headers)
        response = client.get("/api/v1/cart/comparison", headers=headers)
        assert response.status_code == 200
        assert response.json()["bestStore"]["complete"] is True
