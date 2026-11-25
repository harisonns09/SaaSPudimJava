package com.pudim.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@ApplicationScoped
public class InfinitePayClient {

    private static final List<String> EVENTOS_WEBHOOK = List.of("paid", "canceled", "refunded", "payment_failed");

    @ConfigProperty(name = "infinitepay.api-url", defaultValue = "https://api.checkout.infinitepay.io")
    String apiUrl;

    @Inject
    ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Cria um link de checkout hospedado. Os preços são convertidos para centavos.
     * Retorna a URL de pagamento devolvida pela InfinitePay.
     */
    public String criarLink(String handle, String orderNsu, List<ItemCobranca> itens,
                            String redirectUrl, String webhookUrl) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("handle", handle);
        body.put("order_nsu", orderNsu);
        body.put("redirect_url", redirectUrl);

        ArrayNode itensNode = body.putArray("items");
        for (ItemCobranca item : itens) {
            ObjectNode node = itensNode.addObject();
            node.put("quantity", item.quantidade());
            node.put("price", toCentavos(item.precoUnitario()));
            node.put("description", item.descricao());
        }

        ObjectNode webhook = body.putObject("webhook");
        webhook.put("url", webhookUrl);
        ArrayNode eventos = webhook.putArray("events");
        EVENTOS_WEBHOOK.forEach(eventos::add);

        JsonNode resposta = enviar("/links", body);
        JsonNode url = resposta.get("url");
        if (url == null || url.isNull() || url.asText().isBlank()) {
            throw new IllegalStateException("Resposta da InfinitePay sem URL de pagamento: " + resposta);
        }
        return url.asText();
    }

    /**
     * Consulta a transação na InfinitePay. Obrigatório antes de confirmar qualquer pagamento
     * recebido por webhook, pois o webhook não é assinado.
     */
    public PagamentoConsultado consultarPagamento(String handle, String orderNsu, String transactionNsu, String slug) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("handle", handle);
        body.put("order_nsu", orderNsu);
        body.put("transaction_nsu", transactionNsu);
        body.put("slug", slug);

        JsonNode resposta = enviar("/payment_check", body);
        boolean pago = resposta.path("success").asBoolean(false) && resposta.path("paid").asBoolean(false);
        BigDecimal valorPago = resposta.hasNonNull("paid_amount")
                ? BigDecimal.valueOf(resposta.get("paid_amount").asLong()).movePointLeft(2)
                : null;
        return new PagamentoConsultado(pago, valorPago);
    }

    private JsonNode enviar(String caminho, ObjectNode body) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(apiUrl + caminho))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new IllegalStateException("InfinitePay " + caminho + " respondeu HTTP "
                        + response.statusCode() + ": " + response.body());
            }
            return objectMapper.readTree(response.body());
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao chamar InfinitePay " + caminho, e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Chamada à InfinitePay interrompida", e);
        }
    }

    private long toCentavos(BigDecimal valor) {
        return valor.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    public record ItemCobranca(int quantidade, BigDecimal precoUnitario, String descricao) {}

    public record PagamentoConsultado(boolean pago, BigDecimal valorPago) {}
}
