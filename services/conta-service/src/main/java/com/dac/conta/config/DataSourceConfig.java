package com.dac.conta.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary // Define este como o banco principal (CUD)
    @ConfigurationProperties(prefix = "spring.datasource")
    DataSource mainDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean // Define o banco de leitura (R)
    @ConfigurationProperties(prefix = "spring.datasource-read")
    DataSource readDataSource() {
        return DataSourceBuilder.create().build();
    }
}