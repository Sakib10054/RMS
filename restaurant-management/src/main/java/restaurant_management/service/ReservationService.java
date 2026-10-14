package restaurant_management.service;

import restaurant_management.dto.CreateReservationRequest;
import restaurant_management.entity.Reservation;

import java.util.List;

public interface ReservationService {
    Reservation createCustomerReservation(CreateReservationRequest request);
    List<Reservation> getCurrentCustomerReservations();
    Reservation cancelCustomerReservation(Long id);
    List<Reservation> getAllReservationsForStaff();
    Reservation confirmReservation(Long id);
    Reservation rejectReservation(Long id);
}
