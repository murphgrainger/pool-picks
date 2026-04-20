import { Resend } from "resend";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// --- Validators ---

// Validates a single event object (already unwrapped from events[] if needed)
export function validateScoreboardResponse(event: any): ValidationResult {
  const errors: string[] = [];

  if (typeof event?.id !== "string") {
    errors.push(`Expected event.id to be string, got ${typeof event?.id}`);
  }

  const competition = event?.competitions?.[0];
  if (!competition) {
    errors.push("Missing: event.competitions[0]");
    return { valid: false, errors };
  }

  if (!competition.status?.type?.state) {
    errors.push("Missing: competition.status.type.state");
  }

  const competitors = competition.competitors;
  if (!Array.isArray(competitors)) {
    errors.push("Missing or non-array: competition.competitors");
    return { valid: false, errors };
  }

  // Validate shape of first competitor with data
  const sample = competitors[0];
  if (sample) {
    if (typeof sample.athlete?.fullName !== "string") {
      errors.push(
        `Expected competitor.athlete.fullName to be string, got ${typeof sample.athlete?.fullName}`
      );
    }
    if (typeof sample.score !== "string") {
      errors.push(
        `Expected competitor.score to be string, got ${typeof sample.score}`
      );
    }
    if (typeof sample.order !== "number") {
      errors.push(
        `Expected competitor.order to be number, got ${typeof sample.order}`
      );
    }
    if (!Array.isArray(sample.linescores)) {
      errors.push("Missing or non-array: competitor.linescores");
    } else if (sample.linescores.length > 0) {
      const ls = sample.linescores[0];
      if (typeof ls.period !== "number") {
        errors.push(
          `Expected linescore.period to be number, got ${typeof ls.period}`
        );
      }
      // value and displayValue may be absent for rounds not yet played
      // (ESPN returns stubs like {"period": 2} for future rounds)
      if (ls.value !== undefined && typeof ls.value !== "number") {
        errors.push(
          `Expected linescore.value to be number or undefined, got ${typeof ls.value}`
        );
      }
      if (ls.displayValue !== undefined && typeof ls.displayValue !== "string") {
        errors.push(
          `Expected linescore.displayValue to be string or undefined, got ${typeof ls.displayValue}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Lighter validator for field/athlete updates — no score or linescore checks
export function validateFieldResponse(event: any): ValidationResult {
  const errors: string[] = [];

  if (typeof event?.id !== "string") {
    errors.push(`Expected event.id to be string, got ${typeof event?.id}`);
  }

  const competition = event?.competitions?.[0];
  if (!competition) {
    errors.push("Missing: event.competitions[0]");
    return { valid: false, errors };
  }

  const competitors = competition.competitors;
  if (!Array.isArray(competitors)) {
    errors.push("Missing or non-array: competition.competitors");
    return { valid: false, errors };
  }

  const sample = competitors[0];
  if (sample) {
    if (typeof sample.athlete?.fullName !== "string") {
      errors.push(
        `Expected competitor.athlete.fullName to be string, got ${typeof sample.athlete?.fullName}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateScheduleResponse(data: any): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data?.events)) {
    errors.push("Missing or non-array: data.events");
    return { valid: false, errors };
  }

  const sample = data.events[0];
  if (sample) {
    if (typeof sample.id !== "string") {
      errors.push(
        `Expected event.id to be string, got ${typeof sample.id}`
      );
    }
    if (typeof sample.name !== "string" && typeof sample.shortName !== "string") {
      errors.push("Missing: event.name and event.shortName");
    }
    if (typeof sample.date !== "string") {
      errors.push(
        `Expected event.date to be string, got ${typeof sample.date}`
      );
    }
    if (typeof sample.endDate !== "string") {
      errors.push(
        `Expected event.endDate to be string, got ${typeof sample.endDate}`
      );
    }
    if (!sample.status?.type?.name) {
      errors.push("Missing: event.status.type.name");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCoreEventResponse(event: any): ValidationResult {
  const errors: string[] = [];

  if (typeof event?.id !== "string") {
    errors.push(`Expected event.id to be string, got ${typeof event?.id}`);
  }
  if (typeof event?.tournament?.$ref !== "string") {
    errors.push("Missing: event.tournament.$ref");
  }

  return { valid: errors.length === 0, errors };
}

export function validateCoreTournamentResponse(data: any): ValidationResult {
  const errors: string[] = [];

  if (typeof data?.cutRound !== "number") {
    errors.push(`Expected cutRound to be number, got ${typeof data?.cutRound}`);
  }
  if (typeof data?.cutScore !== "number") {
    errors.push(`Expected cutScore to be number, got ${typeof data?.cutScore}`);
  }
  if (typeof data?.cutCount !== "number") {
    errors.push(`Expected cutCount to be number, got ${typeof data?.cutCount}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateEventDetailsResponse(data: any): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(data?.courses)) {
    errors.push("Missing or non-array: data.courses");
    return { valid: false, errors };
  }

  const sample = data.courses[0];
  if (sample) {
    if (typeof sample.name !== "string") {
      errors.push(
        `Expected course.name to be string, got ${typeof sample.name}`
      );
    }
    if (typeof sample.address?.city !== "string") {
      errors.push(
        `Expected course.address.city to be string, got ${typeof sample.address?.city}`
      );
    }
    if (typeof sample.address?.state !== "string") {
      errors.push(
        `Expected course.address.state to be string, got ${typeof sample.address?.state}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Alert Email ---

export async function sendSchemaAlert(
  endpoint: string,
  errors: string[]
): Promise<void> {
  const alertEmail = process.env.ADMIN_ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!alertEmail || !apiKey) {
    console.error(
      "Cannot send schema alert — ADMIN_ALERT_EMAIL or RESEND_API_KEY not set"
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `PoolPicks Alerts <${fromAddress}>`,
      to: alertEmail,
      subject: "PoolPicks: ESPN API schema change detected",
      html: `
        <h2>ESPN API Schema Change Detected</h2>
        <p><strong>Endpoint:</strong> ${endpoint}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Validation errors:</strong></p>
        <ul>${errors.map((e) => `<li>${e}</li>`).join("")}</ul>
        <p>The ESPN JSON API response no longer matches the expected shape. Score syncing is broken until the parsing code is updated.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send schema alert email:", err);
  }
}

// --- Convenience wrapper ---

export async function assertValidResponse(
  data: any,
  validator: (data: any) => ValidationResult,
  endpointLabel: string
): Promise<void> {
  const result = validator(data);
  if (!result.valid) {
    console.error(
      `ESPN schema validation failed for ${endpointLabel}:`,
      result.errors
    );
    // Fire-and-forget — don't block the response on email delivery
    sendSchemaAlert(endpointLabel, result.errors);
    throw new Error(
      "ESPN API response format has changed. The admin has been notified."
    );
  }
}
