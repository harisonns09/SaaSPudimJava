package com.pudim.model;

import java.util.List;

public record PublicMenuResponse(StoreConfig loja, List<Product> produtos) {
}
