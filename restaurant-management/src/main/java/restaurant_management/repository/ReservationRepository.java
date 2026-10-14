package restaurant_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import restaurant_management.entity.Reservation;
import restaurant_management.enums.ReservationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByCustomerIdOrderByReservationDateTimeDesc(Long customerId);
    List<Reservation> findAllByOrderByReservationDateTimeAsc();
    Optional<Reservation> findByOrderId(Long orderId);

    @Query("""
        select count(r) > 0 from Reservation r
        where r.restaurantTable.id = :tableId
          and r.id <> :excludedId
          and r.status in :statuses
          and r.reservationDateTime between :from and :to
        """)
    boolean existsConflictingReservationExcept(
            @Param("tableId") Long tableId,
            @Param("excludedId") Long excludedId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<ReservationStatus> statuses);

    @Query("""
        select count(r) > 0 from Reservation r
        where r.restaurantTable.id = :tableId
          and r.status in :statuses
          and r.reservationDateTime between :from and :to
        """)
    boolean existsConflictingReservation(
            @Param("tableId") Long tableId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<ReservationStatus> statuses);
}
