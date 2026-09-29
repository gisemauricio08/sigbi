package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

//Un solo DTO para entrada y salida: NON_NULL deja fuera lo que no se rellena
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationDTO {

    private Integer idReservation;

    //RN-10: solo lectura
    private LocalDateTime reservationDate;

    @NotNull(message = "{reservation.client.required}")
    private Integer idClient;

    private ClientDTO client;

    //RN-04
    @NotEmpty(message = "{reservation.details.required}")
    private List<@Valid ReservationDetailDTO> details;
}
