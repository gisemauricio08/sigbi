package com.sigbi.repo;

import com.sigbi.model.ReservationDetail;

public interface IReservationDetailRepo extends IGenericRepo<ReservationDetail, Integer> {

    long countByBookIdBook(Integer idBook);
}
