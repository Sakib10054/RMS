package restaurant_management.controller;

import restaurant_management.entity.Payment;
import restaurant_management.enums.PaymentStatus;
import restaurant_management.service.PaymentService;
import restaurant_management.repository.PaymentRepository;
import restaurant_management.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    public PaymentController(PaymentService paymentService, PaymentRepository paymentRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Serves payment proof files only to the order owner or authorized staff.
     * The proof directory is intentionally not mapped as a public static resource.
     */
    @GetMapping("/{id}/proof-file")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getProofFile(@PathVariable Long id, Authentication authentication) {
        var payment = paymentRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Payment not found"));
        boolean staff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF") || a.getAuthority().equals("ROLE_MANAGER"));
        User customer = payment.getOrder() == null ? null : payment.getOrder().getCustomer();
        boolean owner = customer != null && customer.getEmail().equalsIgnoreCase(authentication.getName());
        if (!staff && !owner) {
            throw new org.springframework.security.access.AccessDeniedException("You are not allowed to view this payment proof");
        }
        String storedUrl = payment.getProofFileUrl();
        if (storedUrl == null || storedUrl.isBlank()) {
            throw new jakarta.persistence.EntityNotFoundException("Payment proof file not found");
        }
        String filename = Path.of(storedUrl).getFileName().toString();
        Path base = Path.of("uploads", "payment-proofs").toAbsolutePath().normalize();
        Path file = base.resolve(filename).normalize();
        if (!file.startsWith(base) || !Files.isRegularFile(file)) {
            throw new jakarta.persistence.EntityNotFoundException("Payment proof file not found");
        }
        String contentType;
        try { contentType = Files.probeContentType(file); }
        catch (java.io.IOException ignored) { contentType = null; }
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (contentType != null) {
            try { mediaType = MediaType.parseMediaType(contentType); }
            catch (IllegalArgumentException ignored) { /* keep safe default */ }
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename.replace("\"", "") + "\"")
                .body(new FileSystemResource(file));
    }

    @PostMapping
    public Payment createPayment(@Valid @RequestBody Payment payment) {
        return paymentService.createPayment(payment);
    }

    @PostMapping(value = "/proof", consumes = "multipart/form-data")
    public Payment submitPaymentProof(
            @RequestParam Long orderId,
            @RequestParam restaurant_management.enums.PaymentMethod paymentMethod,
            @RequestParam(required = false) String proofReference,
            @RequestParam(required = false) String proofNote,
            @RequestPart(required = false) org.springframework.web.multipart.MultipartFile proofFile) {
        return paymentService.submitPaymentProof(orderId, paymentMethod, proofReference, proofNote, proofFile);
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/mine")
    public List<Payment> getMyPayments() {
        return paymentService.getCurrentCustomerPayments();
    }

    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable Long id) {
        return paymentService.getPaymentById(id);
    }

    @GetMapping("/order/{orderId}")
    public Payment getPaymentByOrderId(@PathVariable Long orderId) {
        return paymentService.getPaymentByOrderId(orderId);
    }

    @GetMapping("/status/{status}")
    public List<Payment> getPaymentsByStatus(
            @PathVariable PaymentStatus status) {
        return paymentService.getPaymentsByStatus(status);
    }


    @PutMapping("/{id}/proof/reject")
    public Payment rejectPaymentProof(@PathVariable Long id) {
        return paymentService.rejectPaymentProof(id);
    }

    @PutMapping("/{id}/status")
    public Payment updatePaymentStatus(
            @PathVariable Long id,
            @RequestBody PaymentStatus status) {
        return paymentService.updatePaymentStatus(id, status);
    }
}