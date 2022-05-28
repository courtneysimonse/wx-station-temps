# wx-station-temps

## Temperature Data
Temperature Data is from NOAA's 30-Year Normals (1991–2020) https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
I downloaded us-climate-normals_1991-2020_daily_temperature_by-variable_c20210609.tar.gz from https://www.ncei.noaa.gov/data/normals-daily/1991-2020/archive/
Inside the archive, there is are several files, including "dly-temp-normal.csv" and "dly_inventory.txt", which I used as the basis for the map data.

## Preparing Data
The Juypter Notebook [DataPrep.ipnyb](data-prep/DataPrep.ipynb) shows the process from the normals file to the three CSV outputs: 'dly_tmax_bydate.csv', 'dly_tmin_bydate.csv', and 'dly_tavg_bydate.csv'.

The station coordinates are stored in "dly_inventory.txt" and just need to be converted to CSV for use in QGIS.

## Hex Grid
Using QGIS's "Create Grid" algorithim in the Vector Creation toolbox, I created a hexagon grid with a horizontal and vertical spacing of 50 km. The CRS I used was EPSG: 5070 - NAD83 / Conus Albers, an equal area projection. This created a hexagon grid over the extent of the weather stations layer.
Next, I filtered the hexagons to only ones containing one or more weather station points. Exporting this layer with a CRS of WGS84 gives the [hex grid used on the map](data/hex50kmWxStations.js).

## Joining Temperature Data with Grid
In QGIS, join the weather stations point layer with the CSV outputs from [DataPrep.ipnyb](data-prep/DataPrep.ipynb) on station id.
Then use the "Join Attributes by Location (Summary)" tool to join the filtered hex grid and the weather station points and taking the mean of each temperature column (each day's min, max, and avg) for each weather station within the given hexagon. Export this file as a CSV without a geometry column ([minmaxtemps.csv](data/minmaxtemps.csv)). It will be joined to the hex grid in [app.js](scripts/app.js).

## Further Reading
* https://www.ncei.noaa.gov/metadata/geoportal/rest/metadata/item/gov.noaa.ncdc%3AC01621/html
* https://blog.mapbox.com/binning-an-alternative-to-point-maps-2cfc7b01d2ed
* https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.pivot.html
* https://docs.qgis.org/3.22/en/docs/user_manual/processing_algs/qgis/vectorcreation.html#create-grid
* https://docs.qgis.org/3.22/en/docs/user_manual/processing_algs/qgis/vectorgeneral.html#join-attributes-by-location-summary
