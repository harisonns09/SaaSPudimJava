package com.pudim.dto;

import com.pudim.entity.StoreConfig;

import java.util.List;

public class PublicMenuResponse {
    public StoreConfig loja;
    public List<ProductDTO> produtos;

    public PublicMenuResponse() {}

    public PublicMenuResponse(StoreConfig loja, List<ProductDTO> produtos) {
        this.loja = loja;
        this.produtos = produtos;
    }
}
