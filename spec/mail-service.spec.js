import { sendMail, sendTrainingNotification } from "../services/mailService.js";

describe("Mail Service", function () {
  describe("sendMail (test environment)", () => {
    it("should return a mock result in test environment", async () => {
      const result = await sendMail({
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test content",
      });

      expect(result).toHaveProperty("messageId");
      expect(result.messageId).toMatch(/^test-\d+@mock$/);
      expect(result.accepted).toContain("test@example.com");
      expect(result.rejected).toEqual([]);
    });

    it("should handle array of recipients", async () => {
      const result = await sendMail({
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test Subject",
        text: "Test content",
      });

      expect(result.accepted).toEqual(["user1@example.com", "user2@example.com"]);
    });
  });

  describe("sendTrainingNotification", () => {
    it("should return sent count for each recipient", async () => {
      const result = await sendTrainingNotification({
        training: {
          date: new Date("2025-06-15"),
          meetingPoint: "Gare de Test",
          meetingTime: "08:30",
        },
        camp: {
          title: "Camp de Test",
        },
        recipients: [
          { email: "user1@test.com", firstname: "User1" },
          { email: "user2@test.com", firstname: "User2" },
        ],
      });

      expect(result.sent).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should skip recipients without email", async () => {
      const result = await sendTrainingNotification({
        training: {
          date: new Date("2025-06-15"),
          meetingPoint: "Gare",
          meetingTime: "08:30",
        },
        camp: { title: "Camp" },
        recipients: [
          { email: "valid@test.com", firstname: "Valid" },
          { firstname: "NoEmail" }, // No email
          { email: null, firstname: "NullEmail" },
        ],
      });

      expect(result.sent).toBe(1);
    });

    it("should return 0 sent when no recipients", async () => {
      const result = await sendTrainingNotification({
        training: { date: new Date() },
        camp: { title: "Camp" },
        recipients: [],
      });

      expect(result.sent).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should return 0 sent when recipients is null", async () => {
      const result = await sendTrainingNotification({
        training: { date: new Date() },
        camp: { title: "Camp" },
        recipients: null,
      });

      expect(result.sent).toBe(0);
    });

    it("should handle missing date gracefully", async () => {
      const result = await sendTrainingNotification({
        training: {
          meetingPoint: "Gare",
          meetingTime: "08:30",
        },
        camp: { title: "Camp" },
        recipients: [{ email: "test@test.com", firstname: "Test" }],
      });

      expect(result.sent).toBe(1);
    });
  });
});
