package com.mousseomanos.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Entrega ao navegador a chave da Maps JavaScript API. Ela é pública por natureza e deve ser
 * restrita por domínio (HTTP referrer) no Google Cloud; não é a mesma chave usada pelo servidor.
 */
@RestController
@RequestMapping("/api/config")
public class ConfigController {

	private final String mapsApiKey;

	public ConfigController(@Value("${app.google.maps-browser-key:}") String mapsApiKey) {
		this.mapsApiKey = mapsApiKey;
	}

	@GetMapping
	public ConfigResponse config() {
		return new ConfigResponse(mapsApiKey);
	}

	public record ConfigResponse(String mapsApiKey) {
	}
}
