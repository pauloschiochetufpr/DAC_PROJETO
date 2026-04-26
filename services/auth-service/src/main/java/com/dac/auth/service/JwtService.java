package com.dac.auth.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.DirectDecrypter;
import com.nimbusds.jose.crypto.DirectEncrypter;
import com.nimbusds.jwt.EncryptedJWT;
import com.nimbusds.jwt.JWTClaimsSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    // Deriva chave AES-256 (32 bytes) a partir do secret via SHA-256
    private SecretKey getKey() throws Exception {
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(secret.getBytes("UTF-8"));
        return new SecretKeySpec(hash, "AES");
    }

    // Gera um JWE cifrado com AES-256-GCM. O payload e completamente opaco sem a chave.
    public String generateToken(String cpf, String email, String tipo) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(cpf)
                .claim("role", tipo)
                .claim("email", email)
                .jwtID(UUID.randomUUID().toString())
                .issueTime(new Date())
                .expirationTime(new Date(System.currentTimeMillis() + expiration))
                .build();

        JWEHeader header = new JWEHeader(JWEAlgorithm.DIR, EncryptionMethod.A256GCM);
        EncryptedJWT jwt = new EncryptedJWT(header, claims);
        jwt.encrypt(new DirectEncrypter(getKey()));

        return jwt.serialize();
    }

    // Decifra e valida o JWE. Lanca excecao se expirado ou invalido.
    public JWTClaimsSet validateToken(String token) throws Exception {
        EncryptedJWT jwt = EncryptedJWT.parse(token);
        jwt.decrypt(new DirectDecrypter(getKey()));

        JWTClaimsSet claims = jwt.getJWTClaimsSet();
        if (claims.getExpirationTime() == null || claims.getExpirationTime().before(new Date())) {
            throw new Exception("Token expirado");
        }
        return claims;
    }
}
