
package restaurant_management.service.impl;

import restaurant_management.entity.Order;
import restaurant_management.entity.Payment;
import restaurant_management.entity.Reservation;
import restaurant_management.entity.User;

import restaurant_management.enums.OrderStatus;
import restaurant_management.enums.PaymentMethod;
import restaurant_management.enums.PaymentStatus;
import restaurant_management.enums.ReservationStatus;
import restaurant_management.enums.Role;

import restaurant_management.repository.OrderRepository;
import restaurant_management.repository.PaymentRepository;
import restaurant_management.repository.ReservationRepository;
import restaurant_management.repository.UserRepository;

import restaurant_management.service.PaymentService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    public PaymentServiceImpl(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            ReservationRepository reservationRepository) {

        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
    }

    // Get the currently authenticated user
    private User currentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new SecurityException("Authentication required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new SecurityException("Authenticated user not found"));
    }

    // Automatically create an unpaid payment for an eligible order
    @Override
    public Payment createAutomaticPaymentIfEligible(Order order) {

        if (order == null
                || order.getId() == null
                || order.getStatus() != OrderStatus.COMPLETED) {
            return null;
        }

        Reservation reservation =
                reservationRepository.findByOrderId(order.getId()).orElse(null);

        if (reservation != null
                && reservation.getStatus() != ReservationStatus.CONFIRMED) {
            return null;
        }

        return paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    Payment payment = new Payment();

                    payment.setOrder(order);
                    payment.setAmount(order.getTotalAmount());
                    payment.setPaymentMethod(PaymentMethod.CASH);
                    payment.setPaymentStatus(PaymentStatus.UNPAID);
                    payment.setPaymentDate(null);

                    return paymentRepository.save(payment);
                });
    }

    // Create a payment
    @Override
    public Payment createPayment(Payment payment) {

        if (payment == null) {
            throw new IllegalArgumentException("Payment is required");
        }

        if (payment.getOrder() == null
                || payment.getOrder().getId() == null) {
            throw new IllegalArgumentException("Order ID is required");
        }

        Long orderId = payment.getOrder().getId();
        User user = currentUser();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found"));

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Cannot create payment for a cancelled order");
        }

        if (user.getRole() == Role.CUSTOMER
                && (order.getCustomer() == null
                || !user.getId().equals(order.getCustomer().getId()))) {
            throw new SecurityException(
                    "You are not allowed to submit payment for this order");
        }

        if (paymentRepository.existsByOrderId(orderId)) {
            throw new IllegalArgumentException(
                    "Payment already exists for this order");
        }

        if (payment.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Payment method is required");
        }

        if (user.getRole() == Role.CUSTOMER
                && (payment.getProofReference() == null
                || payment.getProofReference().isBlank())) {
            throw new IllegalArgumentException(
                    "Payment proof reference is required");
        }

        payment.setId(null);
        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentStatus(PaymentStatus.UNPAID);
        payment.setPaymentDate(null);

        return paymentRepository.save(payment);
    }

    // Submit payment proof, optionally with a file
    @Override
    public Payment submitPaymentProof(
            Long orderId,
            PaymentMethod paymentMethod,
            String proofReference,
            String proofNote,
            MultipartFile proofFile) {

        if (orderId == null) {
            throw new IllegalArgumentException("Order ID is required");
        }

        if (paymentMethod == null) {
            throw new IllegalArgumentException("Payment method is required");
        }

        boolean hasReference =
                proofReference != null && !proofReference.isBlank();

        boolean hasFile =
                proofFile != null && !proofFile.isEmpty();

        if (!hasReference && !hasFile) {
            throw new IllegalArgumentException(
                    "Provide a transaction/reference number or proof file");
        }

        User customer = currentUser();

        if (customer.getRole() != Role.CUSTOMER) {
            throw new SecurityException(
                    "Only customers can submit payment proofs");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found"));

        if (order.getCustomer() == null
                || !customer.getId().equals(order.getCustomer().getId())) {
            throw new SecurityException(
                    "You are not allowed to submit proof for this order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Cannot submit proof for a cancelled order");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(Payment::new);

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException(
                    "This payment has already been verified");
        }

        payment.setOrder(order);
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(paymentMethod);
        payment.setPaymentStatus(PaymentStatus.UNPAID);
        payment.setPaymentDate(null);
        payment.setProofReference(
                proofReference == null ? null : proofReference.trim());
        payment.setProofNote(
                proofNote == null ? null : proofNote.trim());

        if (hasFile) {
            String contentType = proofFile.getContentType();
            String extension;

            // Allow only supported file content types
            if ("image/jpeg".equalsIgnoreCase(contentType)) {
                extension = ".jpg";
            } else if ("image/png".equalsIgnoreCase(contentType)) {
                extension = ".png";
            } else if ("image/webp".equalsIgnoreCase(contentType)) {
                extension = ".webp";
            } else if ("application/pdf".equalsIgnoreCase(contentType)) {
                extension = ".pdf";
            } else {
                throw new IllegalArgumentException(
                        "Proof file must be JPG, PNG, WEBP or PDF");
            }

            // Maximum file size: 5 MB
            if (proofFile.getSize() > 5L * 1024 * 1024) {
                throw new IllegalArgumentException(
                        "Proof file must be 5 MB or smaller");
            }

            try {
                // Use an absolute, normalized upload directory
                Path uploadDir = Path.of(
                        "uploads", "payment-proofs"
                ).toAbsolutePath().normalize();

                Files.createDirectories(uploadDir);

                // Generate a safe filename instead of using the original name
                String filename = UUID.randomUUID() + extension;

                Path target = uploadDir.resolve(filename)
                        .toAbsolutePath()
                        .normalize();

                // Ensure the destination stays inside the upload directory
                if (!target.startsWith(uploadDir)) {
                    throw new IllegalArgumentException(
                            "Invalid proof file path");
                }

                try (var inputStream = proofFile.getInputStream()) {
                    Files.copy(
                            inputStream,
                            target,
                            StandardCopyOption.REPLACE_EXISTING);
                }

                payment.setProofFileUrl(
                        "/uploads/payment-proofs/" + filename);

            } catch (IOException ex) {
                throw new IllegalStateException(
                        "Could not save payment proof file", ex);
            }
        }

        return paymentRepository.save(payment);
    }

    // Get payment by ID
    @Override
    @Transactional(readOnly = true)
    public Payment getPaymentById(Long id) {

        return paymentRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Payment not found"));
    }

    // Get payment by order ID
    @Override
    @Transactional(readOnly = true)
    public Payment getPaymentByOrderId(Long orderId) {

        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Payment not found for this order"));
    }

    // Get all payments
    @Override
    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    // Get payments belonging to the current customer
    @Override
    @Transactional(readOnly = true)
    public List<Payment> getCurrentCustomerPayments() {

        User customer = currentUser();

        return paymentRepository.findByOrderCustomerId(customer.getId());
    }

    // Get payments by status
    @Override
    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByStatus(
            PaymentStatus paymentStatus) {

        if (paymentStatus == null) {
            throw new IllegalArgumentException(
                    "Payment status is required");
        }

        return paymentRepository.findByPaymentStatus(paymentStatus);
    }

    // Reject submitted payment proof
    @Override
    public Payment rejectPaymentProof(Long id) {

        User reviewer = currentUser();

        if (reviewer.getRole() != Role.STAFF
                && reviewer.getRole() != Role.MANAGER) {
            throw new SecurityException(
                    "Only staff or manager can reject payment proofs");
        }

        Payment payment = getPaymentById(id);

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalArgumentException(
                    "A paid payment cannot have its proof rejected");
        }

        String oldFileUrl = payment.getProofFileUrl();

        payment.setProofReference(null);
        payment.setProofNote(null);
        payment.setProofFileUrl(null);

        // Delete the old file only if it is inside the payment-proof directory
        if (oldFileUrl != null
                && oldFileUrl.startsWith("/uploads/payment-proofs/")) {

            String filename = oldFileUrl.substring(
                    "/uploads/payment-proofs/".length());

            try {
                Path uploadDir = Path.of(
                        "uploads", "payment-proofs"
                ).toAbsolutePath().normalize();

                Path fileToDelete = uploadDir.resolve(filename)
                        .toAbsolutePath()
                        .normalize();

                if (fileToDelete.startsWith(uploadDir)) {
                    Files.deleteIfExists(fileToDelete);
                }

            } catch (IOException ignored) {
                // Keep the database update even if file deletion fails.
            }
        }

        return paymentRepository.save(payment);
    }

    // Update payment status
    @Override
    public Payment updatePaymentStatus(
            Long id,
            PaymentStatus paymentStatus) {

        if (paymentStatus == null) {
            throw new IllegalArgumentException(
                    "Payment status is required");
        }

        User reviewer = currentUser();

        if (reviewer.getRole() != Role.STAFF
                && reviewer.getRole() != Role.MANAGER) {
            throw new SecurityException(
                    "Only staff or manager can review payments");
        }

        Payment payment = getPaymentById(id);
        Order order = payment.getOrder();

        if (payment.getPaymentStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalArgumentException(
                    "Refunded payment cannot be changed");
        }

        if (paymentStatus == PaymentStatus.PAID
                && order != null
                && order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Cannot mark payment as PAID for a cancelled order");
        }

        if (paymentStatus == PaymentStatus.REFUNDED
                && payment.getPaymentStatus() != PaymentStatus.PAID) {
            throw new IllegalArgumentException(
                    "Only paid payments can be refunded");
        }

        payment.setPaymentStatus(paymentStatus);

        if (paymentStatus == PaymentStatus.PAID) {
            payment.setPaymentDate(LocalDateTime.now());
        } else if (paymentStatus == PaymentStatus.REFUNDED) {
            if (payment.getPaymentDate() == null) {
                payment.setPaymentDate(LocalDateTime.now());
            }
        } else {
            payment.setPaymentDate(null);
        }

        return paymentRepository.save(payment);
    }
}