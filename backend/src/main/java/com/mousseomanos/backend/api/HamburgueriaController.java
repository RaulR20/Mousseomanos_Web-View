package com.mousseomanos.backend.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/hamburguerias")
public class HamburgueriaController {

	private final HamburgueriaService service;

	public HamburgueriaController(HamburgueriaService service) {
		this.service = service;
	}

	@GetMapping
	public List<Hamburgueria> search(@RequestParam double lat, @RequestParam double lng) {
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordenadas inválidas");
		}
		return service.searchNear(lat, lng);
	}
}
