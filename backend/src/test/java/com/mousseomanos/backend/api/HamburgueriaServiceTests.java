package com.mousseomanos.backend.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class HamburgueriaServiceTests {

	private static final String URL = "https://places.googleapis.com/v1/places:searchText";

	private final RestClient.Builder builder = RestClient.builder();
	private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

	@Test
	void searchNearBiasesTheSearchToTheCoordinatesAndMapsTheResult() {
		server.expect(requestTo(URL))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("X-Goog-Api-Key", "chave-teste"))
				.andExpect(header("X-Goog-FieldMask", "places.displayName,places.location"))
				.andExpect(content().string(containsString("locationBias")))
				.andExpect(content().string(containsString("-23.5")))
				.andRespond(withSuccess("""
						{"places":[
						  {"displayName":{"text":"Burger Bom"},"location":{"latitude":-23.51,"longitude":-46.61}},
						  {"displayName":{"text":"Sem local"}}
						]}
						""", MediaType.APPLICATION_JSON));

		List<Hamburgueria> result = new HamburgueriaService(builder, "chave-teste").searchNear(-23.5, -46.6);

		assertThat(result).containsExactly(new Hamburgueria("Burger Bom", -23.51, -46.61));
		server.verify();
	}

	@Test
	void returnsAnEmptyListWhenGoogleFindsNothing() {
		server.expect(requestTo(URL)).andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

		assertThat(new HamburgueriaService(builder, "chave-teste").searchNear(-23.5, -46.6)).isEmpty();
	}

	@Test
	void failsWithServiceUnavailableWhenTheKeyIsMissing() {
		HamburgueriaService service = new HamburgueriaService(builder, "");

		assertThatThrownBy(() -> service.searchNear(-23.5, -46.6))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode().value()).isEqualTo(503));
	}

	@Test
	void failsWithBadGatewayWhenGoogleReturnsAnError() {
		server.expect(requestTo(URL)).andRespond(withServerError());
		HamburgueriaService service = new HamburgueriaService(builder, "chave-teste");

		assertThatThrownBy(() -> service.searchNear(-23.5, -46.6))
				.isInstanceOfSatisfying(ResponseStatusException.class,
						ex -> assertThat(ex.getStatusCode().value()).isEqualTo(502));
	}
}
