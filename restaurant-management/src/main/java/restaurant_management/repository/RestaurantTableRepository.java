package restaurant_management.repository;

import restaurant_management.entity.RestaurantTable;
import restaurant_management.enums.TableStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository
        extends JpaRepository<RestaurantTable, Long> {

    Optional<RestaurantTable> findByTableNumber(
            Integer tableNumber
    );

    /**
     * Locks the table row for the current transaction.
     *
     * This prevents two concurrent dine-in orders from both
     * seeing the same table as AVAILABLE and booking it.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT t
        FROM RestaurantTable t
        WHERE t.id = :tableId
        """)
    Optional<RestaurantTable> findByIdForUpdate(
            @Param("tableId") Long tableId
    );

    boolean existsByTableNumber(
            Integer tableNumber
    );

    List<RestaurantTable> findByStatus(
            TableStatus status
    );

    long countByStatus(
            TableStatus status
    );
}