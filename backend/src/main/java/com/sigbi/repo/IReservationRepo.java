package com.sigbi.repo;

import com.sigbi.model.Reservation;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IReservationRepo extends IGenericRepo<Reservation, Integer> {

    long countByClientIdClient(Integer idClient);

    //JOIN FETCH: el mapeo a DTO ocurre fuera de la sesión y la carga perezosa
    //lanzaría LazyInitializationException
    @Query("SELECT DISTINCT r FROM Reservation r "
            + "JOIN FETCH r.client "
            + "LEFT JOIN FETCH r.details d "
            + "LEFT JOIN FETCH d.book "
            + "ORDER BY r.reservationDate DESC")
    List<Reservation> findAllWithDetails();

    @Query("SELECT DISTINCT r FROM Reservation r "
            + "JOIN FETCH r.client c "
            + "LEFT JOIN FETCH r.details d "
            + "LEFT JOIN FETCH d.book "
            + "WHERE c.idClient = :idClient "
            + "ORDER BY r.reservationDate DESC")
    List<Reservation> findByClientWithDetails(@Param("idClient") Integer idClient);

    @Query("SELECT r FROM Reservation r "
            + "JOIN FETCH r.client "
            + "LEFT JOIN FETCH r.details d "
            + "LEFT JOIN FETCH d.book "
            + "WHERE r.idReservation = :id")
    Optional<Reservation> findByIdWithDetails(@Param("id") Integer id);
}
