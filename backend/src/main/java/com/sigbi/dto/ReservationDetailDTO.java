package com.sigbi.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationDetailDTO {

    private Integer idReservationDetail;

    //Entrada
    @NotNull(message = "{reservation.detail.book.required}")
    private Integer idBook;

    //Salida: id y título del libro
    private BookDTO book;
}
