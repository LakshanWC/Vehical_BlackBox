import java.util.LinkedList;
import java.util.Queue;
import java.util.Scanner;

public class EventTicketSystem {

    static class Customer {
        private String name;
        private double ticketPrice;

        // Constructor at the top of the class
        public Customer(String name, double ticketPrice) {
            this.name = name;
            this.ticketPrice = ticketPrice;
        }

        public String getName() {
            return name;
        }

        public double getTicketPrice() {
            return ticketPrice;
        }
    }

    private static void displayCustomers(Queue<Customer> queue) {
        //create temporary queue
        Queue<Customer> tempQueue = new LinkedList<>();
        int position = 1;

        System.out.println("\nTicket Purchase Sequence:");
        while (!queue.isEmpty()) {
            Customer customer = queue.poll();
            System.out.println(position + ". " + customer.getName() +
                    " - Ticket Price: Rs." + customer.getTicketPrice());
            tempQueue.add(customer);
            position++;
        }

        // restore the original queue
        while (!tempQueue.isEmpty()) {
            queue.add(tempQueue.poll());
        }
    }

    private static void processRefunds(Queue<Customer> queue) {
        //give 10% discount for first 10 customer
        final double DISCOUNT_RATE = 0.10;
        int customersProcessed = 0;
        Queue<Customer> tempQueue = new LinkedList<>();

        System.out.println("\nRefund Details for First 10 Customers:");
        while (!queue.isEmpty() && customersProcessed < 10) {
            Customer customer = queue.poll();
            double refundAmount = customer.getTicketPrice() * DISCOUNT_RATE;

            System.out.println((customersProcessed + 1) + ". " + customer.getName() +
                    " - Refund Amount: Rs." + String.format("%.2f", refundAmount));

            tempQueue.add(customer);
            customersProcessed++;
        }

        // add remaining customers back to the queue
        while (!queue.isEmpty()) {
            tempQueue.add(queue.poll());
        }

        // restore the original queue
        while (!tempQueue.isEmpty()) {
            queue.add(tempQueue.poll());
        }
    }

    private static Queue<Customer> inputCustomerData(Scanner scanner) {
        Queue<Customer> customerQueue = new LinkedList<>();
        System.out.println("Enter customer details (max 20)");

        for (int i = 0; i < 20; i++) {
            System.out.print("Add another customer? (yes/no): ");
            String choice = scanner.next();
            if (!choice.equalsIgnoreCase("yes")) {
                break;
            }

            System.out.print("Enter customer name: ");
            String name = scanner.next();
            System.out.print("Enter ticket price: Rs.");
            double price = scanner.nextDouble();

            customerQueue.add(new Customer(name, price));
        }
        return customerQueue;
    }

    // Main method at the bottom
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        Queue<Customer> customerQueue = inputCustomerData(scanner);

        displayCustomers(customerQueue);
        processRefunds(customerQueue);

        scanner.close();
    }
}