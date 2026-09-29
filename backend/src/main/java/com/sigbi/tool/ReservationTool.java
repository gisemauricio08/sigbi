package com.sigbi.tool;

import com.sigbi.model.Client;
import com.sigbi.model.Reservation;
import com.sigbi.model.ReservationDetail;
import com.sigbi.service.IClientService;
import com.sigbi.service.IReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

//Solo lectura a propósito: un modelo con una herramienta de escritura acaba usándola,
//por claro que sea el prompt. Sin ella, la negativa a registrar no depende del prompt
@Component
@RequiredArgsConstructor
public class ReservationTool {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final IReservationService reservationService;
    private final IClientService clientService;

    public record ReservaInfo(String fecha, String cliente, List<String> libros) {}

    @Tool(name = "listarReservas",
          description = "Lista las reservas registradas, de la más reciente a la más antigua, con su cliente y los títulos que incluyen")
    public List<ReservaInfo> listarReservas() throws Exception {
        return reservationService.findAll().stream().map(this::aInfo).toList();
    }

    @Tool(name = "buscarReservasDeCliente",
          description = "Lista las reservas de un cliente, buscándolo por su nombre o apellidos")
    public List<ReservaInfo> buscarReservasDeCliente(String nombre) throws Exception {
        String aguja = nombre == null ? "" : nombre.toLowerCase().trim();

        List<Integer> ids = clientService.findAll().stream()
                .filter(cliente -> nombreCompleto(cliente).toLowerCase().contains(aguja))
                .map(Client::getIdClient)
                .toList();

        if (ids.isEmpty()) return List.of();

        List<ReservaInfo> reservas = new java.util.ArrayList<>();
        for (Integer id : ids) {
            reservationService.findByClient(id).stream().map(this::aInfo).forEach(reservas::add);
        }

        return reservas;
    }

    private ReservaInfo aInfo(Reservation reserva) {
        List<String> titulos = reserva.getDetails() == null ? List.of() : reserva.getDetails().stream()
                .map(ReservationDetail::getBook)
                .filter(libro -> libro != null)
                .map(libro -> libro.getTitle())
                .toList();

        return new ReservaInfo(
                reserva.getReservationDate() != null ? reserva.getReservationDate().format(FECHA) : "sin fecha",
                reserva.getClient() != null ? nombreCompleto(reserva.getClient()) : "Cliente desconocido",
                titulos);
    }

    private String nombreCompleto(Client cliente) {
        return cliente.getFirstName() + " " + cliente.getLastName();
    }
}
