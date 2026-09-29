package com.sigbi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Integer idReservation;

    //RN-10
    @Column(nullable = false)
    private LocalDateTime reservationDate;

    @ManyToOne
    @JoinColumn(name = "id_client", nullable = false,
            foreignKey = @ForeignKey(name = "FK_RESERVATION_CLIENT"))
    private Client client;

    //cascade: cabecera y detalles en un solo save (RN-09). orphanRemoval: RN-13
    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReservationDetail> details;
}
