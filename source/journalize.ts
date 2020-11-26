/* eslint-disable @typescript-eslint/no-explicit-any */
import { Journaly } from 'journaly';
export class JournalizeDB {
  private journaly: Journaly;
  private model;

  constructor(model, journaly: Journaly) {
    this.model = model;
    this.journaly = journaly;
  }

  getJournaly(): Journaly {
    return this.journaly;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getModel() {
    return this.model;
  }
}
