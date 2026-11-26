package com.pudim.dto;

import com.pudim.entity.Product;
import com.pudim.entity.StoreConfig;

import java.util.List;

public record PublicMenuResponse(StoreConfig loja, List<Product> produtos) {
}
