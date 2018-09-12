

module.exports = class CockpitHelpers {
  constructor(cockpit, config) {
    this.cockpit = cockpit;
    this.config = config;
  }

  // get cockpit collection items by collection name
  async getCollectionItems(name) {
    const { fields, entries } = await this.cockpit.collectionGet(name);
    return { fields, entries, name };
  }

  // get all cockpit collections, together with their items
  async getCockpitCollections() {
    const collections = await this.getCollectionNames();
    return Promise.all(collections.map(name => this.getCollectionItems(name)));
  }

  async getCollectionNames() {
    const allCollections = await this.cockpit.collectionList();
    const explictlyDefinedCollections = this.config.collections;

    return explictlyDefinedCollections instanceof Array
      ? allCollections.filter(
        name => explictlyDefinedCollections.indexOf(name) > -1
      )
      : allCollections;
  }

   // get cockpit singleton items by singleton name
   async getSingletonItems(name) {
    const entry = await this.cockpit.singletonGet(name);
    const schema = await this.cockpit.singletonSchema(name);

    // Convert fields array into key -> value object to match
    // collection schema
    const fields = schema.fields ? schema.fields.reduce(
      (obj, field) => {
        obj[field.name] = field;
        return obj;
      },
      {}
    ) : {};
    return { fields, entry, name };
  }

  // get all cockpit singletons, together with their items
  async getCockpitSingletons() {
    const singletons = await this.getSingletonNames();
    return Promise.all(singletons.map(name => this.getSingletonItems(name)));
  }

  async getSingletonNames() {
    const all = await this.cockpit.singletonList();
    const explictlyDefinedSingletons = this.config.singltons;

    return explictlyDefinedSingletons instanceof Array
      ? all.filter(
        name => explictlyDefinedSingletons.indexOf(name) > -1
      )
      : all;
  }

  // get cockpit collection items by collection name
  async getRegionItems(name) {
    const values = await this.cockpit.regionData(name);
    const template = await this.cockpit.regionGet(name);
    return { data: {values, template}, name };
  }

  // get all cockpit regions, together with their items
  async getCockpitRegions() {
    const regions = await this.getRegionNames();
    return Promise.all(regions.map(name => {
      var i = this.getRegionItems(name);
      return i;
    }));
  }  

  async getRegionNames() {
    
    const allRegions = await this.cockpit.regionList(); 
    const explictlyDefinedRegions = this.config.regions;

    return explictlyDefinedRegions instanceof Array
      ? allRegions.filter(
        name => explictlyDefinedRegions.indexOf(name) > -1
      )
      : allRegions;
  }
}
