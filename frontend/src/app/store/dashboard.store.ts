import { computed, inject, Service } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { Book } from "../model/book";
import { Category } from "../model/category";
import { Client } from "../model/client";
import { Reservation } from "../model/reservation";
import { BookService } from "../services/book.service";
import { CategoryService } from "../services/category.service";
import { ClientService } from "../services/client.service";
import { ReservationService } from "../services/reservation.service";

const DIAS_RECIENTES = 7;

//Sin endpoint de agregados: todo se calcula sobre los cuatro listados. El recuento por categoría
//sale de bookCount; contarlo desde los libros perdería las categorías vacías.
@Service({autoProvided: false})
export class DashboardStore{

    private readonly bookService = inject(BookService);
    private readonly categoryService = inject(CategoryService);
    private readonly clientService = inject(ClientService);
    private readonly reservationService = inject(ReservationService);

    readonly booksResource = httpResource<Book[]>(() => this.bookService.resourceUrl, { defaultValue: [] });
    readonly categoriesResource = httpResource<Category[]>(() => this.categoryService.resourceUrl, { defaultValue: [] });
    readonly clientsResource = httpResource<Client[]>(() => this.clientService.resourceUrl, { defaultValue: [] });
    readonly reservationsResource = httpResource<Reservation[]>(() => this.reservationService.resourceUrl, { defaultValue: [] });

    private readonly recursos = [
        this.booksResource,
        this.categoriesResource,
        this.clientsResource,
        this.reservationsResource,
    ];

    readonly $loading = computed(() => this.recursos.some((r) => r.isLoading()));
    readonly $error = computed(() => this.recursos.map((r) => r.error()).find(Boolean));

    //value() lanza con el recurso en error: hasValue() lo evita
    readonly $books = computed(() => this.booksResource.hasValue() ? this.booksResource.value() : []);
    readonly $categories = computed(() => this.categoriesResource.hasValue() ? this.categoriesResource.value() : []);
    readonly $clients = computed(() => this.clientsResource.hasValue() ? this.clientsResource.value() : []);
    readonly $reservations = computed(() => this.reservationsResource.hasValue() ? this.reservationsResource.value() : []);

    readonly $totalLibros = computed(() => this.$books().length);
    readonly $disponibles = computed(() => this.$books().filter((libro) => libro.available).length);
    readonly $reservados = computed(() => this.$totalLibros() - this.$disponibles());

    readonly $porcentajeReservado = computed(() => {
        const total = this.$totalLibros();

        return total ? Math.round((this.$reservados() / total) * 100) : 0;
    });

    readonly $categoriasActivas = computed(() => this.$categories().filter((c) => c.status).length);

    readonly $totalReservas = computed(() => this.$reservations().length);

    readonly $reservasRecientes = computed(() => {
        const limite = Date.now() - DIAS_RECIENTES * 24 * 60 * 60 * 1000;

        return this.$reservations().filter((reserva) => {
            if (!reserva.reservationDate) return false;

            return new Date(reserva.reservationDate).getTime() >= limite;
        }).length;
    });

    readonly $totalClientes = computed(() => this.$clients().length);

    readonly $clientesConReserva = computed(() => {
        const ids = new Set(this.$reservations().map((reserva) => reserva.client?.idClient ?? reserva.idClient));

        return this.$clients().filter((cliente) => ids.has(cliente.idClient)).length;
    });

    readonly $porCategoria = computed(() => {
        const disponiblesPorCategoria = new Map<number, number>();

        for (const libro of this.$books()) {
            if (!libro.available) continue;

            disponiblesPorCategoria.set(libro.idCategory, (disponiblesPorCategoria.get(libro.idCategory) ?? 0) + 1);
        }

        return this.$categories()
            .map((categoria) => ({
                idCategory: categoria.idCategory,
                name: categoria.name,
                status: categoria.status,
                total: categoria.bookCount ?? 0,
                disponibles: disponiblesPorCategoria.get(categoria.idCategory) ?? 0,
            }))
            .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    });

    readonly $maximoPorCategoria = computed(() =>
        Math.max(1, ...this.$porCategoria().map((fila) => fila.total)),
    );

    reload(){
        for (const recurso of this.recursos) {
            recurso.reload();
        }
    }
}
