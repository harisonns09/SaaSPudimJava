package com.pudim.service;

import com.pudim.dto.StoreConfigUpdateRequest;
import com.pudim.entity.StoreConfig;
import com.pudim.exception.ConflictException;
import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.StoreConfigRepository;
import com.pudim.repository.UserRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class StoreConfigService {

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    LoginService loginService;

    @Inject
    TenantContext tenantContext;

    public StoreConfig getConfiguration(String tenantId) {
        setTenant(tenantId);
        return storeConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Configuração da loja não encontrada."));
    }

    public List<StoreConfig> listStores() {
        return storeConfigRepository.listAll(Sort.by("nomeLoja"));
    }

    /**
     * Cria a loja e o usuário admin inicial. Usado pelo cadastro público e pelo superadmin.
     */
    @Transactional
    public StoreConfig createStore(String nomeLoja, String adminEmail, String adminPassword) {
        if (isBlank(nomeLoja) || isBlank(adminEmail) || isBlank(adminPassword)) {
            throw new ValidationException("Nome da loja, e-mail e senha são obrigatórios.");
        }
        String email = adminEmail.trim();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Já existe uma conta com este e-mail.");
        }

        String slug = generateSlug(nomeLoja);
        if (slug.isBlank()) {
            throw new ValidationException("O nome da loja precisa conter letras ou números.");
        }
        if (storeConfigRepository.findBySlug(slug).isPresent()) {
            throw new ConflictException("Já existe uma loja com endereço \"" + slug + "\". Escolha outro nome.");
        }

        String tenantId = UUID.randomUUID().toString();
        tenantContext.setTenantId(tenantId);

        StoreConfig store = new StoreConfig();
        store.tenantId = tenantId;
        store.nomeLoja = nomeLoja.trim();
        store.slug = slug;
        storeConfigRepository.persist(store);

        loginService.createUser(email, adminPassword, tenantId, Set.of("admin"));
        return store;
    }

    /**
     * Atualiza os dados editáveis pelo lojista. O slug e o tenantId não entram aqui:
     * o slug forma a URL pública e já está embutido em links de pagamento gerados.
     */
    @Transactional
    public StoreConfig saveConfiguration(String tenantId, StoreConfigUpdateRequest changes) {
        setTenant(tenantId);
        if (changes == null || changes.nomeLoja == null || changes.nomeLoja.isBlank()) {
            throw new ValidationException("O nome da loja é obrigatório.");
        }
        if (changes.taxaEntregaPadrao != null && changes.taxaEntregaPadrao.signum() < 0) {
            throw new ValidationException("A taxa de entrega não pode ser negativa.");
        }

        StoreConfig config = getConfiguration(tenantId);
        config.nomeLoja = changes.nomeLoja.trim();
        config.subtitulo = blankToNull(changes.subtitulo);
        config.taxaEntregaPadrao = changes.taxaEntregaPadrao;
        config.abertaParaEncomendas = changes.abertaParaEncomendas;
        config.infinitepayHandle = normalizeHandle(changes.infinitepayHandle);
        config.tipoNegocio = blankToNull(changes.tipoNegocio) != null ? changes.tipoNegocio.trim() : "Geral";
        return config;
    }

    @Transactional
    public StoreConfig setStoreActive(String tenantId, boolean ativa) {
        StoreConfig config = getConfiguration(tenantId);
        config.ativa = ativa;
        return config;
    }

    private static String generateSlug(String storeName) {
        String normalized = Normalizer.normalize(storeName.trim(), Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    // A InfiniteTag é salva sem o "$", mesmo que o lojista o digite.
    private static String normalizeHandle(String handle) {
        String limpo = blankToNull(handle);
        if (limpo != null && limpo.startsWith("$")) {
            limpo = limpo.substring(1).trim();
        }
        return limpo == null || limpo.isEmpty() ? null : limpo;
    }

    // Normaliza uma lista separada por vírgula: remove espaços, itens vazios e duplicados.
    private static String normalizeList(String value) {
        if (blankToNull(value) == null) {
            return null;
        }
        String resultado = java.util.Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isEmpty())
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        return resultado.isEmpty() ? null : resultado;
    }

    private void setTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("A sessão não contém um tenant válido.");
        }
        tenantContext.setTenantId(tenantId);
    }
}
