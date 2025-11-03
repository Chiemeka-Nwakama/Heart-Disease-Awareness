<script lang="ts">
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import type { TMovie } from "../../types";
  import Bar from "../../lib/Bar.svelte";
  import LineChart from "../../lib/LineChart.svelte";
  import CorrelationMatrix from "../../lib/CorrelationMatrix.svelte";


  //In completing this assignment, I utilized ChatGPT for helping in assistance with the code for my line chart and correlation matrix implementations. 

  // Reactive variable for storing the data
  let movies: TMovie[] = [];

  // Function to load the CSV
  async function loadCsv() {
    try {
      const csvUrl = "./summer_movies.csv";
      movies = await d3.csv(csvUrl, (row) => {
        // TIP: in row, all values are strings, so we need to use a row conversion function here to format them
        return {

         
          simple_title: row.simple_title.trim(), // remove extra spaces
          primary_title: row.primary_title.trim(), // remove extra spaces
          original_title: row.original_title.trim(), // remove extra spaces
          genres: row.genres.trim().split(","), // remove extra spaces
          year: new Date(row.year), //year as date                   
          average_rating: Number(row.average_rating),     // convert to number
          num_votes: Number(row.num_votes), // convert to number
          run_time: Number(row.run_time),   // convert to number
          tconst: row.tconst.trim(), // convert to number
          title_type: row.title_type.trim(), // remove extra spaces


          // ...row, // spread syntax to copy all properties from row
          // num_votes: Number(row.num_votes),
          // year: new Date(row.year),
          // please also format the values for other non-string attributes. You can check the attributes in the CSV file
        };
      });

      console.log("Loaded CSV Data:", movies);
    } catch (error) {
      console.error("Error loading CSV:", error);
    }
  }
  // Call the loader when the component mounts
  onMount(loadCsv);
</script>

<h1>Summer Movies</h1>

<p>Here are {movies.length == 0 ? "..." : movies.length + " "} movies</p>
<!-- <Bar {movies} /> -->
<Bar {movies} width={600} height={400} />

<h1>Q1: How do the top three movie genres (by number of movies) change over time?</h1>


<!-- put final graph here for Q1-->
<LineChart {movies} width={1200} height={400} />

<h1>Q2: Are there any correlations between different genres?</h1>

<CorrelationMatrix {movies} width={1200} height={800} />

<!-- put final graph here for Q2-->