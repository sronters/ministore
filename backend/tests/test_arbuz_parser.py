from app.parsers.sources.arbuz import parse_arbuz_html


def test_parse_arbuz_product_attribute() -> None:
    html = """
    <product-card
      :product="{&quot;id&quot;:&quot;327220&quot;,&quot;catalogName&quot;:&quot;Молоко&quot;,&quot;name&quot;:&quot;Молоко ЭкоНива 2.5%, 1 л&quot;,&quot;brandName&quot;:&quot;Эконива&quot;,&quot;uri&quot;:&quot;/ru/almaty/catalog/item/327220-moloko_ekoniva&quot;,&quot;image&quot;:&quot;https://arbuz.kz/image/s3/arbuz-kz-products/file_name__4660141574363.jpg?w=%w&amp;h=%h&quot;,&quot;priceActual&quot;:1499,&quot;pricePrevious&quot;:1770,&quot;isAvailable&quot;:true}">
    </product-card>
    """

    products = parse_arbuz_html(html, city="almaty")

    assert len(products) == 1
    assert products[0].external_id == "327220"
    assert products[0].price == 1499
    assert products[0].old_price == 1770
    assert products[0].barcode == "4660141574363"
    assert products[0].package_unit == "l"
    assert products[0].in_stock is True
