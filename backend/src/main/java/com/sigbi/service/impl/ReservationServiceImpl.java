package com.sigbi.service.impl;

import com.sigbi.exception.BusinessRuleException;
import com.sigbi.exception.ModelNotFoundException;
import com.sigbi.model.Book;
import com.sigbi.model.Client;
import com.sigbi.model.Reservation;
import com.sigbi.model.ReservationDetail;
import com.sigbi.repo.IBookRepo;
import com.sigbi.repo.IClientRepo;
import com.sigbi.repo.IGenericRepo;
import com.sigbi.repo.IReservationRepo;
import com.sigbi.service.IReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl extends CRUDImpl<Reservation, Integer> implements IReservationService {

    private final IReservationRepo repo;
    private final IClientRepo clientRepo;
    private final IBookRepo bookRepo;
    private final MessageSource messageSource;

    @Override
    protected IGenericRepo<Reservation, Integer> getRepo() {
        return repo;
    }

    //RN-09: todas las validaciones van antes del primer insert; @Transactional cubre el resto
    @Transactional
    @Override
    public Reservation save(Reservation entity) throws Exception {
        Client client = resolveClient(entity);
        List<Book> books = resolveBooks(entity);

        entity.setIdReservation(null);
        entity.setClient(client);
        entity.setReservationDate(LocalDateTime.now());
        entity.getDetails().forEach(detail -> {
            detail.setIdReservationDetail(null);
            detail.setReservation(entity);
        });

        Reservation saved = repo.save(entity);

        //RN-07
        books.forEach(book -> book.setAvailable(false));
        bookRepo.saveAll(books);

        return saved;
    }

    //RN-13: los detalles se van por orphanRemoval; los libros se leen antes del borrado
    @Transactional
    @Override
    public void delete(Integer id) throws Exception {
        Reservation reservation = findById(id);

        List<Integer> bookIds = reservation.getDetails().stream()
                .map(detail -> detail.getBook().getIdBook())
                .toList();

        super.delete(id);

        List<Book> books = bookRepo.findAllById(bookIds);
        books.forEach(book -> book.setAvailable(true));
        bookRepo.saveAll(books);
    }

    @Override
    public List<Reservation> findAll() throws Exception {
        return repo.findAllWithDetails();
    }

    @Override
    public Reservation findById(Integer id) throws Exception {
        return repo.findByIdWithDetails(id)
                .orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + id));
    }

    @Override
    public List<Reservation> findByClient(Integer idClient) throws Exception {
        clientRepo.findById(idClient)
                .orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + idClient));

        return repo.findByClientWithDetails(idClient);
    }

    //RN-03
    private Client resolveClient(Reservation entity) {
        Integer idClient = entity.getClient() != null ? entity.getClient().getIdClient() : null;

        if (idClient == null) {
            throw new BusinessRuleException(message("reservation.client.required"));
        }

        return clientRepo.findById(idClient)
                .orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + idClient));
    }

    //RN-04, RN-05, RN-08 y RN-06, en ese orden
    private List<Book> resolveBooks(Reservation entity) {
        List<ReservationDetail> details = entity.getDetails();

        if (details == null || details.isEmpty()) {
            throw new BusinessRuleException(message("reservation.details.required"));
        }

        Set<Integer> seen = new HashSet<>();
        List<Book> books = new ArrayList<>();

        for (ReservationDetail detail : details) {
            Integer idBook = detail.getBook() != null ? detail.getBook().getIdBook() : null;

            if (idBook == null) {
                throw new BusinessRuleException(message("reservation.detail.book.required"));
            }

            if (!seen.add(idBook)) {
                throw new BusinessRuleException(
                        message("reservation.book.duplicated", idBook));
            }

            Book book = bookRepo.findById(idBook)
                    .orElseThrow(() -> new ModelNotFoundException("ID NOT FOUND: " + idBook));

            if (Boolean.FALSE.equals(book.getAvailable())) {
                throw new BusinessRuleException(
                        message("reservation.book.unavailable", book.getTitle()));
            }

            detail.setBook(book);
            books.add(book);
        }

        return books;
    }

    private String message(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }
}
