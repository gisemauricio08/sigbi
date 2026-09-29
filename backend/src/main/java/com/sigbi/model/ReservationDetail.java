package com.sigbi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ReservationDetail {

    //idReservationDetail y no idDetail: CRUDImpl.update() resuelve setId<ClassName> por reflexión
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer idReservationDetail;

    //Corta la recursión cabecera -> detalle -> cabecera del toString() de @Data (StackOverflowError)
    @ToString.Exclude
    @ManyToOne
    @JoinColumn(name = "id_reservation", nullable = false,
            foreignKey = @ForeignKey(name = "FK_RESERVATION_DETAIL_RESERVATION"))
    private Reservation reservation;

    @ManyToOne
    @JoinColumn(name = "id_book", nullable = false,
            foreignKey = @ForeignKey(name = "FK_RESERVATION_DETAIL_BOOK"))
    private Book book;
}
