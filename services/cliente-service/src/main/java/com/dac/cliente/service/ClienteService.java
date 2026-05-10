package com.dac.cliente.service;

import com.dac.cliente.config.RabbitMQConfig;
import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.dto.request.PerfilRequestDTO;
import com.dac.cliente.dto.response.ClienteParaAprovarResponseDTO;
import com.dac.cliente.dto.response.ClienteResponseDTO;
import com.dac.cliente.dto.response.DadosClienteResponseDTO;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository repository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // -------------------------
    // R1 — Autocadastro
    // Publica para auth-service criar o usuário
    // -------------------------
    @Transactional
    public void autocadastro(AutocadastroRequestDTO dto) {
        validarAutocadastro(dto);

        String cpf = normalizarDocumento(dto.getCpf());

        if (repository.existsById(cpf)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente já cadastrado ou aguardando aprovação");
        }
        if (repository.existsByEmail(normalizarEmail(dto.getEmail()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setNome(normalizarTexto(dto.getNome()));
        c.setEmail(normalizarEmail(dto.getEmail()));
        c.setTelefone(normalizarTexto(dto.getTelefone()));
        c.setSalario(dto.getSalario());
        c.setEndereco(normalizarTexto(dto.getEndereco()));
        c.setCep(normalizarDocumento(dto.getCep()));
        c.setCidade(normalizarTexto(dto.getCidade()));
        c.setEstado(normalizarUf(dto.getEstado()));
        c.setStatus(StatusCliente.PENDENTE);

        repository.save(c);

        // Publica para auth-service criar usuário pendente
        try {
            Map<String, String> authEvento = new HashMap<>();
            authEvento.put("acao", "criar");
            authEvento.put("cpf", cpf);
            authEvento.put("email", normalizarEmail(dto.getEmail()));
            authEvento.put("senha", "tads"); // senha padrão inicial
            authEvento.put("tipo", "cliente");
            rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_AUTH_CRIAR, authEvento);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento auth.criar: "
                + e.getMessage());
        }
    }

    // -------------------------
    // R9 — Listar pendentes
    // -------------------------
    public List<ClienteParaAprovarResponseDTO> listarParaAprovar() {
        return repository.findByStatus(StatusCliente.PENDENTE)
                .stream()
                .map(this::toParaAprovarDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // R12 — Listar aprovados
    // -------------------------
    public List<ClienteResponseDTO> listarTodosAprovados() {
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .map(this::toClienteResponseDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // R16 — Relatório admin
    // -------------------------
    public List<DadosClienteResponseDTO> listarParaRelatorio() {
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .map(this::toDadosClienteDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // Melhores clientes — top 3 por salário
    // -------------------------
    public List<ClienteResponseDTO> listarMelhoresClientes() {
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .sorted((a, b) -> Double.compare(
                    b.getSalario() != null ? b.getSalario() : 0,
                    a.getSalario() != null ? a.getSalario() : 0))
                .limit(3)
                .map(this::toClienteResponseDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // R13 — Consultar por CPF
    // -------------------------
    public DadosClienteResponseDTO consultarPorCpf(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));
        return toDadosClienteDTO(c);
    }

    // -------------------------
    // R4 — Atualizar perfil
    // Se salário mudar, publica para conta-service atualizar limite
    // -------------------------
    @Transactional
    public DadosClienteResponseDTO atualizarPerfil(String cpf, PerfilRequestDTO dto) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (dto.getEmail() != null && !dto.getEmail().equals(c.getEmail())) {
            if (repository.existsByEmail(normalizarEmail(dto.getEmail()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email já cadastrado por outro cliente");
            }
        }

        boolean salarioAlterado = dto.getSalario() != null
            && !dto.getSalario().equals(c.getSalario());

        if (dto.getNome() != null)     c.setNome(normalizarTexto(dto.getNome()));
        if (dto.getEmail() != null)    c.setEmail(normalizarEmail(dto.getEmail()));
        if (dto.getSalario() != null)  c.setSalario(dto.getSalario());
        if (dto.getEndereco() != null) c.setEndereco(normalizarTexto(dto.getEndereco()));
        if (dto.getCep() != null)      c.setCep(normalizarDocumento(dto.getCep()));
        if (dto.getCidade() != null)   c.setCidade(normalizarTexto(dto.getCidade()));
        if (dto.getEstado() != null)   c.setEstado(normalizarUf(dto.getEstado()));

        repository.save(c);

        // R4: se salário mudou, notifica conta-service para recalcular limite
        if (salarioAlterado) {
            try {
                Map<String, Object> limiteEvento = new HashMap<>();
                limiteEvento.put("clienteCpf", cpf);
                limiteEvento.put("novoSalario", dto.getSalario());
                rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_CONTA_LIMITE, limiteEvento);
            } catch (Exception e) {
                System.err.println("cliente-service: aviso - não foi possível publicar evento conta.limite: "
                    + e.getMessage());
            }
        }

        return toDadosClienteDTO(c);
    }

    // -------------------------
    // R10 — Aprovar cliente
    // Publica para saga-service criar conta
    // -------------------------
    @Transactional
    public void aprovarCliente(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (c.getStatus() != StatusCliente.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente não está pendente de aprovação");
        }

        c.setStatus(StatusCliente.APROVADO);
        c.setDataAprovacao(LocalDateTime.now());
        repository.save(c);

        // Calcula limite baseado no salário
        double limite = 0.0;
        if (c.getSalario() != null && c.getSalario() >= 2000) {
            limite = c.getSalario() / 2;
        }

        // Publica para saga-service orquestrar criação de conta + seleção de gerente
        try {
            Map<String, Object> sagaEvento = new HashMap<>();
            sagaEvento.put("acao", "criar_conta");
            sagaEvento.put("cpf", cpf);
            sagaEvento.put("nome", c.getNome());
            sagaEvento.put("email", c.getEmail());
            sagaEvento.put("limite", limite);
            rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_SAGA_APROVAR, sagaEvento);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento saga.aprovar_cliente: "
                + e.getMessage());
        }
    }

    // -------------------------
    // R11 — Rejeitar cliente
    // Publica para auth-service remover usuário
    // -------------------------
    @Transactional
    public void rejeitarCliente(String cpf, String motivo) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (c.getStatus() != StatusCliente.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente não está pendente de aprovação");
        }

        c.setStatus(StatusCliente.REJEITADO);
        c.setMotivoRejeicao(motivo);
        repository.save(c);

        // Remove usuário do auth-service
        try {
            Map<String, String> authEvento = new HashMap<>();
            authEvento.put("acao", "remover");
            authEvento.put("cpf", cpf);
            rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_AUTH_REMOVER, authEvento);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento auth.remover: "
                + e.getMessage());
        }
    }

    // -------------------------
    // Normalização
    // -------------------------

    private String normalizarTexto(String v) {
        return v == null ? null : v.trim();
    }

    private String normalizarEmail(String v) {
        return v == null ? null : v.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizarDocumento(String v) {
        return v == null ? null : v.replaceAll("\\D", "");
    }

    private String normalizarUf(String v) {
        return v == null ? null : v.trim().toUpperCase(Locale.ROOT);
    }

    private boolean estaVazio(String v) {
        return v == null || v.trim().isEmpty();
    }

    // -------------------------
    // Validação de autocadastro
    // -------------------------

    private void validarAutocadastro(AutocadastroRequestDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados obrigatórios");
        if (estaVazio(dto.getCpf()))      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF obrigatório");
        if (estaVazio(dto.getNome()))     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome obrigatório");
        if (estaVazio(dto.getEmail()))    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obrigatório");
        if (estaVazio(dto.getEndereco())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereço obrigatório");
        if (estaVazio(dto.getCep()))      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP obrigatório");
        if (estaVazio(dto.getCidade()))   throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cidade obrigatória");
        if (estaVazio(dto.getEstado()))   throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado obrigatório");
        if (dto.getSalario() == null || dto.getSalario() < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Salário inválido");

        String cpf = normalizarDocumento(dto.getCpf());
        if (cpf.length() != 11)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido");

        String cep = normalizarDocumento(dto.getCep());
        if (cep.length() != 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP inválido");

        String email = normalizarEmail(dto.getEmail());
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email inválido");

        String estado = normalizarUf(dto.getEstado());
        if (estado.length() != 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "UF inválida");
    }

    // -------------------------
    // Mappers
    // -------------------------

    private ClienteParaAprovarResponseDTO toParaAprovarDTO(Cliente c) {
        ClienteParaAprovarResponseDTO dto = new ClienteParaAprovarResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setSalario(c.getSalario());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        return dto;
    }

    private ClienteResponseDTO toClienteResponseDTO(Cliente c) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setTelefone(c.getTelefone());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        dto.setConta(null);
        dto.setSaldo(null);
        dto.setLimite(null);
        return dto;
    }

    private DadosClienteResponseDTO toDadosClienteDTO(Cliente c) {
        DadosClienteResponseDTO dto = new DadosClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setTelefone(c.getTelefone());
        dto.setEmail(c.getEmail());
        dto.setEndereco(c.getEndereco());
        dto.setCep(c.getCep());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        dto.setSalario(c.getSalario());
        dto.setConta(null);
        dto.setSaldo(null);
        dto.setLimite(null);
        dto.setGerente(null);
        dto.setGerente_nome(null);
        dto.setGerente_email(null);
        return dto;
    }
}