import {
  advanceGoalProgress,
  assertForwardOnlyProgression,
  createGoalProgress,
  getNextStep,
  getRemainingSteps,
  isGoalComplete,
  isForwardOnlyProgression,
  validateGoalPlan,
} from "./goal-tracker";

const createPlan = () => ({
  goalId: "goal-1",
  title: "Ship the thing",
  steps: [
    { id: "step-1", title: "Define scope" },
    { id: "step-2", title: "Implement" },
    { id: "step-3", title: "Verify" },
  ],
});

describe("goal-tracker", () => {
  it("creates progress for a valid plan", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);

    expect(progress).toEqual({
      goalId: "goal-1",
      completed: [],
    });
  });

  it("advances progress in order", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);

    const next = getNextStep(plan, progress);
    expect(next).toEqual({ id: "step-1", title: "Define scope" });

    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );

    const progress2 = advanceGoalProgress(
      plan,
      progress1,
      "step-2",
      "2024-01-02T00:00:00.000Z",
    );

    const progress3 = advanceGoalProgress(
      plan,
      progress2,
      "step-3",
      "2024-01-03T00:00:00.000Z",
    );

    expect(progress3.completed).toEqual([
      { stepId: "step-1", completedAt: "2024-01-01T00:00:00.000Z" },
      { stepId: "step-2", completedAt: "2024-01-02T00:00:00.000Z" },
      { stepId: "step-3", completedAt: "2024-01-03T00:00:00.000Z" },
    ]);

    expect(isGoalComplete(plan, progress3)).toBe(true);
  });

  it("returns remaining steps", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );

    expect(getRemainingSteps(plan, progress1)).toEqual([
      { id: "step-2", title: "Implement" },
      { id: "step-3", title: "Verify" },
    ]);
  });

  it("rejects duplicate step completion", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );

    expect(() => {
      advanceGoalProgress(plan, progress1, "step-1");
    }).toThrow("already been completed");
  });

  it("rejects skipping steps", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);

    expect(() => {
      advanceGoalProgress(plan, progress, "step-2");
    }).toThrow("not the next required step");
  });

  it("rejects unknown steps", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);

    expect(() => {
      advanceGoalProgress(plan, progress, "step-unknown");
    }).toThrow("not the next required step");
  });

  it("rejects mismatched progress goal ids", () => {
    const plan = createPlan();
    const progress = {
      goalId: "other-goal",
      completed: [],
    };

    expect(() => {
      getNextStep(plan, progress);
    }).toThrow("does not match plan");
  });

  it("rejects out-of-order progress", () => {
    const plan = createPlan();
    const progress = {
      goalId: "goal-1",
      completed: [
        { stepId: "step-2", completedAt: "2024-01-02T00:00:00.000Z" },
      ],
    };

    expect(() => {
      getRemainingSteps(plan, progress);
    }).toThrow("out of order");
  });

  it("validates plans with duplicate step ids", () => {
    const plan = {
      goalId: "goal-1",
      title: "Duplicate",
      steps: [
        { id: "step-1", title: "First" },
        { id: "step-1", title: "Second" },
      ],
    };

    expect(() => {
      validateGoalPlan(plan);
    }).toThrow("duplicated");
  });

  it("asserts forward-only progression", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );
    const progress2 = advanceGoalProgress(
      plan,
      progress1,
      "step-2",
      "2024-01-02T00:00:00.000Z",
    );

    expect(() => {
      assertForwardOnlyProgression(plan, progress1, progress2);
    }).not.toThrow();
  });

  it("rejects regression in forward-only checks", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );

    expect(() => {
      assertForwardOnlyProgression(plan, progress1, progress);
    }).toThrow("regressed");
  });

  it("rejects diverging completion history", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );
    const divergent = {
      goalId: "goal-1",
      completed: [
        { stepId: "step-1", completedAt: "2024-02-01T00:00:00.000Z" },
      ],
    };

    expect(() => {
      assertForwardOnlyProgression(plan, progress1, divergent);
    }).toThrow("diverged");
  });

  it("returns false when forward-only checks fail", () => {
    const plan = createPlan();
    const progress = createGoalProgress(plan);
    const progress1 = advanceGoalProgress(
      plan,
      progress,
      "step-1",
      "2024-01-01T00:00:00.000Z",
    );
    const divergent = {
      goalId: "goal-1",
      completed: [
        { stepId: "step-1", completedAt: "2024-02-01T00:00:00.000Z" },
      ],
    };

    expect(isForwardOnlyProgression(plan, progress1, divergent)).toBe(false);
  });
});
