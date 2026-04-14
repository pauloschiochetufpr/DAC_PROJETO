package com.dac.cliente.service;

import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.dto.request.PerfilRequestDTO;
import com.dac.cliente.dto.response.ClienteParaAprovarResponseDTO;
import com.dac.cliente.dto.response.ClienteResponseDTO;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

public class ClienteService {
    
}
