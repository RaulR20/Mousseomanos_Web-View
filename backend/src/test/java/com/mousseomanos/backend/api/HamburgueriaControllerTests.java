package com.mousseomanos.backend.api;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "app.google.maps-browser-key=chave-navegador")
@AutoConfigureMockMvc
class HamburgueriaControllerTests {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private HamburgueriaService service;

	@Test
	void searchesByCoordinates() throws Exception {
		when(service.searchNear(-23.5, -46.6)).thenReturn(List.of(new Hamburgueria("Burger Bom", -23.51, -46.61)));

		mockMvc.perform(get("/api/hamburguerias").param("lat", "-23.5").param("lng", "-46.6"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Burger Bom"))
				.andExpect(jsonPath("$[0].latitude").value(-23.51))
				.andExpect(jsonPath("$[0].longitude").value(-46.61));
	}

	@Test
	void rejectsARequestWithoutCoordinates() throws Exception {
		mockMvc.perform(get("/api/hamburguerias")).andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/hamburguerias").param("lat", "-23.5")).andExpect(status().isBadRequest());
	}

	@Test
	void rejectsOutOfRangeCoordinates() throws Exception {
		mockMvc.perform(get("/api/hamburguerias").param("lat", "91").param("lng", "0"))
				.andExpect(status().isBadRequest());
		mockMvc.perform(get("/api/hamburguerias").param("lat", "0").param("lng", "181"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void exposesTheBrowserKeyForTheMap() throws Exception {
		mockMvc.perform(get("/api/config"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.mapsApiKey").value("chave-navegador"));
	}
}
