package com.sigbi.controller;

import com.sigbi.dto.BookDTO;
import com.sigbi.dto.ClientDTO;
import com.sigbi.dto.ReservationDTO;
import com.sigbi.dto.ReservationDetailDTO;
import com.sigbi.model.Book;
import com.sigbi.model.Client;
import com.sigbi.model.Reservation;
import com.sigbi.model.ReservationDetail;
import com.sigbi.service.IReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/v1/reservations")
public class ReservationController {

    private final IReservationService service;

    @GetMapping
    public ResponseEntity<List<ReservationDTO>> findAll() throws Exception {
        List<ReservationDTO> list = service.findAll().stream().map(this::convertToDto).toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservationDTO> findById(@PathVariable Integer id) throws Exception {
        return ResponseEntity.ok(convertToDto(service.findById(id)));
    }

    @GetMapping("/client/{id}")
    public ResponseEntity<List<ReservationDTO>> findByClient(@PathVariable Integer id) throws Exception {
        List<ReservationDTO> list = service.findByClient(id).stream().map(this::convertToDto).toList();

        return ResponseEntity.ok(list);
    }

    @PostMapping
    public ResponseEntity<Void> save(@Valid @RequestBody ReservationDTO dto) throws Exception {
        Reservation obj = service.save(convertToEntity(dto));

        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(obj.getIdReservation()).toUri();

        return ResponseEntity.created(location).build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) throws Exception {
        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    //Mapeo a mano: ModelMapper no resuelve cliente y libro anidados.
    //La fecha no se copia del DTO (RN-10)
    private Reservation convertToEntity(ReservationDTO dto) {
        Client client = new Client();
        client.setIdClient(dto.getIdClient());

        Reservation obj = new Reservation();
        obj.setClient(client);

        List<ReservationDetail> details = new ArrayList<>();
        for (ReservationDetailDTO detailDto : dto.getDetails()) {
            Book book = new Book();
            book.setIdBook(detailDto.getIdBook());

            ReservationDetail detail = new ReservationDetail();
            detail.setBook(book);
            details.add(detail);
        }
        obj.setDetails(details);

        return obj;
    }

    private ReservationDTO convertToDto(Reservation obj) {
        ReservationDTO dto = new ReservationDTO();
        dto.setIdReservation(obj.getIdReservation());
        dto.setReservationDate(obj.getReservationDate());

        if (obj.getClient() != null) {
            ClientDTO client = new ClientDTO();
            client.setIdClient(obj.getClient().getIdClient());
            client.setFirstName(obj.getClient().getFirstName());
            client.setLastName(obj.getClient().getLastName());
            dto.setClient(client);
        }

        List<ReservationDetailDTO> details = new ArrayList<>();
        if (obj.getDetails() != null) {
            for (ReservationDetail detail : obj.getDetails()) {
                ReservationDetailDTO detailDto = new ReservationDetailDTO();
                detailDto.setIdReservationDetail(detail.getIdReservationDetail());

                if (detail.getBook() != null) {
                    BookDTO book = new BookDTO();
                    book.setIdBook(detail.getBook().getIdBook());
                    book.setTitle(detail.getBook().getTitle());
                    detailDto.setBook(book);
                }

                details.add(detailDto);
            }
        }
        dto.setDetails(details);

        return dto;
    }
}
