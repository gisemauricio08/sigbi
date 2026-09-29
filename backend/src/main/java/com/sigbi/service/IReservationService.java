package com.sigbi.service;

import com.sigbi.model.Reservation;

import java.util.List;

public interface IReservationService extends ICRUD<Reservation, Integer> {

    List<Reservation> findByClient(Integer idClient) throws Exception;
}
