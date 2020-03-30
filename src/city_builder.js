module.exports = class CityBuilder {
  constructor() {
    this.next_street = -1;
  }

  street_id() {
    this.next_street++;
    return this.next_street;
  }
}
