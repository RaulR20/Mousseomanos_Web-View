package com.mousseomanos.backend.api;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HamburgueriaService {

	private static final String SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
	private static final String FIELD_MASK = "places.displayName,places.location";
	private static final double RADIUS_METERS = 3000.0;
	private static final int MAX_RESULTS = 20;

	private final RestClient restClient;
	private final String apiKey;

	public HamburgueriaService(RestClient.Builder restClientBuilder,
			@Value("${app.google.maps-api-key:}") String apiKey) {
		this.restClient = restClientBuilder.build();
		this.apiKey = apiKey;
	}

	public List<Hamburgueria> searchNear(double latitude, double longitude) {
		if (!StringUtils.hasText(apiKey)) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chave do Google Maps não configurada");
		}

		Map<String, Object> center = Map.of("latitude", latitude, "longitude", longitude);
		Map<String, Object> circle = Map.of("center", center, "radius", RADIUS_METERS);
		Map<String, Object> body = Map.of(
				"textQuery", "hamburgueria",
				"locationBias", Map.of("circle", circle),
				"languageCode", "pt-BR",
				"regionCode", "BR",
				"pageSize", MAX_RESULTS);

		PlacesResponse response;
		try {
			response = restClient.post()
					.uri(SEARCH_TEXT_URL)
					.header("X-Goog-Api-Key", apiKey)
					.header("X-Goog-FieldMask", FIELD_MASK)
					.body(body)
					.retrieve()
					.body(PlacesResponse.class);
		}
		catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao consultar o Google Maps", ex);
		}

		if (response == null || response.places() == null) {
			return List.of();
		}
		return response.places().stream()
				.filter(place -> place.location() != null)
				.map(place -> new Hamburgueria(
						place.displayName() != null ? place.displayName().text() : null,
						place.location().latitude(),
						place.location().longitude()))
				.toList();
	}

	record PlacesResponse(List<Place> places) {
	}

	record Place(DisplayName displayName, Location location) {
	}

	record DisplayName(String text) {
	}

	record Location(double latitude, double longitude) {
	}
}
