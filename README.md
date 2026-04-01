<div align="center">
  <h1>
    <br/>
    👍
    <br />
    country-data
    <br />
    <br />
  </h1>
  <sup>
  </sup>
  <br />
  <div align="center" style="display:none;">
  <pre>npm i <a href="https://github.dev/toodiff/country-data"></a></pre>
  </div>
  <br />
  <br />
</div>

# country-data
countries and areas, and provinces or states of country

## Usage

First, you should install `yarn` library.

- install devDependencies
    ```node 
    yarn install
    ```

- download GeoPackage from [Natural Earth](https://www.naturalearthdata.com/downloads/), replace `natural_earth_vector.gpkg` in `db` directory by it.  Don't upload it because of it's large size.

    Execute the following command and genetate data file. Data file is `file/countries_areas_provinces.ts`

    ```node 
    yarn start
    ```

- crawl data from [un.org](https://unstats.un.org/unsd/methodology/m49/)

    Execute the following command and genetate data file. Data file is `file/countries_areas.ts`

    ```node 
    yarn un
    ```
    
- crawl geo json data from web

    Execute the following command and genetate data file. Data file is `geo`
    {COUNTRY_CODE} is iso_code in `file/countries_areas_provinces.ts`

    ```node 
    yarn run geo {COUNTRY_CODE}
    ```

You should modify files in `src` for getting more data.
