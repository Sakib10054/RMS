package restaurant_management.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import restaurant_management.dto.CreateReservationRequest;
import restaurant_management.entity.Reservation;
import restaurant_management.service.ReservationService;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    private final ReservationService reservationService;
    public ReservationController(ReservationService reservationService) { this.reservationService = reservationService; }

    @PostMapping
    public ResponseEntity<Reservation> create(@Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.createCustomerReservation(request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Reservation>> mine() { return ResponseEntity.ok(reservationService.getCurrentCustomerReservations()); }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Reservation> cancel(@PathVariable Long id) { return ResponseEntity.ok(reservationService.cancelCustomerReservation(id)); }

    @GetMapping
    public ResponseEntity<List<Reservation>> all() { return ResponseEntity.ok(reservationService.getAllReservationsForStaff()); }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Reservation> confirm(@PathVariable Long id) { return ResponseEntity.ok(reservationService.confirmReservation(id)); }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Reservation> reject(@PathVariable Long id) { return ResponseEntity.ok(reservationService.rejectReservation(id)); }
}
