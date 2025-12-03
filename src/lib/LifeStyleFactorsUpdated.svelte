<script lang="ts">
	import * as d3 from "d3";
	export let data = [];

	// -----------------------------
	// FACTOR CONFIG
	// -----------------------------
	const factors = [
		{ key: "BMI", label: "Body Mass Index", type: "continuous" },
		{ key: "SleepHours", label: "Sleep Hours", type: "continuous" },
		{
			key: "SmokerStatus",
			label: "Smoking Status",
			type: "category",
			categories: ["Never", "Former", "Current: some days", "Every day"]
		},
		{
			key: "AlcoholDrinkers",
			label: "Alcohol Use",
			type: "category",
			categories: ["No", "Yes"]
		},
		{ key: "Sex", label: "Sex", type: "category", categories: ["Female", "Male"] },
		{
			key: "AgeCategory",
			label: "Age Category",
			type: "category",
			categories: [
				"18–24","25–29","30–34","35–39","40–44","45–49","50–54",
				"55–59","60–64","65–69","70–74","75–79","80+"
			]
		},
		{
			key: "RaceEthnicityCategory",
			label: "Race / Ethnicity",
			type: "category",
			categories: ["White","Black","Hispanic","Asian","Indigenous","Multiracial"]
		}
	];

	// Maps for readable labels
	const maps = {
		Sex: { 0: "Male", 1: "Female" },
		SmokerStatus: {
			0: "Never",
			1: "Former",
			2: "Current: some days",
			3: "Every day"
		},
		AgeCategory: {
			12: "18–24", 11: "25–29", 10: "30–34", 9: "35–39",
			8: "45–49", 7: "50–54", 6: "75–79", 5: "60–64",
			4: "65–69", 3: "70–74", 2: "40–44", 1: "55–59", 0: "80+"
		},
		RaceEthnicityCategory: {
			0: "White", 1: "Black", 2: "Asian",
			3: "Indigenous", 4: "Hispanic", 6: "Multiracial"
		},
		AlcoholDrinkers: { 0: "No", 1: "Yes" }
	};

	function readable(f, v) {
		return maps[f]?.[v] ?? String(v);
	}

	// Active factor
	let activeFactor = "AgeCategory";
	let hoveredNode = null;
	let tooltipData = null;

	// DOM SVG container
	let svgEl;
	let containerEl;

	const width = 650;
	const radius = width / 2 - 10;

	// -----------------------------------
	// REBUILD SUNBURST DATA WHEN NEEDED
	// -----------------------------------
	$: if (data.length && svgEl) {
		buildSunburst();
	}

	function buildHierarchy(raw, factor) {
		// Factor → Category → { heartDisease: count, noHeartDisease: count }
		const grouped = d3.group(
			raw,
			d => readable(factor, d[factor]),
			d => d.HadHeartAttack == 1 ? "Heart Disease" : "No Heart Disease"
		);

		const children = [];

		for (let [cat, sub] of grouped) {
			const hdCount = sub.get("Heart Disease")?.length ?? 0;
			const noHdCount = sub.get("No Heart Disease")?.length ?? 0;
			
			children.push({
				name: cat,
				children: [
					{
						name: "Heart Disease",
						value: hdCount,
						fullName: "Has Heart Disease"
					},
					{
						name: "No Heart Disease",
						value: noHdCount,
						fullName: "No Heart Disease"
					}
				]
			});
		}

		return { name: "root", children };
	}

	// -----------------------------------
	// BUILD ZOOMABLE SUNBURST
	// -----------------------------------
	function buildSunburst() {
		if (!svgEl) return;
		d3.select(svgEl).selectAll("*").remove();

		const root = d3
			.partition()
			.size([2 * Math.PI, radius])(
				d3
					.hierarchy(buildHierarchy(data, activeFactor))
					.sum(d => d.value)
					.sort((a, b) => (b.value || 0) - (a.value || 0))
			);

		root.each(d => (d.current = d));

		const svg = d3
			.select(svgEl)
			.attr("viewBox", [-width / 2, -width / 2, width, width])
			.style("font-family", "system-ui, sans-serif");

		// Enhanced color scheme
		const categoryColors = d3.scaleOrdinal()
			.domain(root.children.map(d => d.data.name))
			.range([
				'#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
				'#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
				'#14b8a6', '#06b6d4', '#0ea5e9'
			]);

		function getColor(d) {
			if (d.depth === 1) {
				return categoryColors(d.data.name);
			} else if (d.depth === 2) {
				// Lighter/darker version for inner ring
				const parentColor = categoryColors(d.parent.data.name);
				if (d.data.name === "Heart Disease") {
					return d3.color(parentColor).darker(0.5);
				} else {
					return d3.color(parentColor).brighter(0.3);
				}
			}
			return "#ccc";
		}

		const arc = d3.arc()
			.startAngle(d => d.x0)
			.endAngle(d => d.x1)
			.padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
			.padRadius(radius / 2)
			.innerRadius(d => d.y0)
			.outerRadius(d => d.y1 - 1);

		const path = svg
			.append("g")
			.selectAll("path")
			.data(root.descendants().slice(1))
			.enter()
			.append("path")
			.attr("d", arc)
			.attr("fill", d => getColor(d))
			.attr("stroke", "#fff")
			.attr("stroke-width", 2)
			.attr("cursor", d => (d.children ? "pointer" : "default"))
			.style("opacity", 0.85)
			.on("mouseenter", function(event, d) {
				d3.select(this).style("opacity", 1);
				hoveredNode = d;
				
				// Calculate tooltip position
				const [x, y] = d3.pointer(event, containerEl);
				const total = root.value;
				const percentage = ((d.value / total) * 100).toFixed(1);
				const pathStr = d.ancestors().reverse().map(a => a.data.name).filter(n => n !== "root").join(" → ");
				
				tooltipData = {
					x: x + 10,
					y: y - 10,
					path: pathStr,
					count: d.value.toLocaleString(),
					percentage: percentage
				};
			})
			.on("mouseleave", function(event, d) {
				d3.select(this).style("opacity", 0.85);
				hoveredNode = null;
				tooltipData = null;
			})
			.on("click", clicked);

		// Labels for outer ring (categories)
		const labelGroup = svg
			.append("g")
			.attr("pointer-events", "none")
			.style("user-select", "none");

		labelGroup
			.selectAll("text")
			.data(root.descendants().filter(d => d.depth === 1))
			.enter()
			.append("text")
			.attr("transform", d => {
				const angle = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
				const r = (d.y0 + d.y1) / 2;
				const rotate = angle - 90;
				const flip = angle > 180 ? 180 : 0;
				return `rotate(${rotate}) translate(${r},0) rotate(${flip})`;
			})
			.attr("text-anchor", "middle")
			.attr("dy", "0.35em")
			.style("font-size", d => {
				// Adjust font size based on arc length
				const arcLength = ((d.x1 - d.x0) * (d.y0 + d.y1) / 2);
				return `${Math.min(12, Math.max(8, arcLength / 8))}px`;
			})
			.style("font-weight", "600")
			.style("fill", "#1f2937")
			.text(d => {
				const arcLength = ((d.x1 - d.x0) * (d.y0 + d.y1) / 2);
				const text = d.data.name;
				// Truncate if too long
				if (text.length * 6 > arcLength) {
					return text.substring(0, Math.floor(arcLength / 6)) + "...";
				}
				return text;
			});

		// Percentage labels for inner ring
		labelGroup
			.selectAll("text.inner-label")
			.data(root.descendants().filter(d => d.depth === 2))
			.enter()
			.append("text")
			.attr("class", "inner-label")
			.attr("transform", d => {
				const angle = ((d.x0 + d.x1) / 2) * 180 / Math.PI;
				const r = (d.y0 + d.y1) / 2;
				const rotate = angle - 90;
				const flip = angle > 180 ? 180 : 0;
				return `rotate(${rotate}) translate(${r},0) rotate(${flip})`;
			})
			.attr("text-anchor", "middle")
			.attr("dy", "0.35em")
			.style("font-size", "9px")
			.style("font-weight", "500")
			.style("fill", d => {
				// Choose contrasting color
				const bgColor = getColor(d);
				const brightness = d3.color(bgColor).rgb();
				return (brightness.r * 0.299 + brightness.g * 0.587 + brightness.b * 0.114) > 150 ? "#000" : "#fff";
			})
			.text(d => {
				const percentage = ((d.value / root.value) * 100);
				return percentage > 2 ? `${percentage.toFixed(0)}%` : "";
			});

		// Center circle with info
		const centerG = svg.append("g");
		
		centerG.append("circle")
			.attr("r", radius * 0.25)
			.attr("fill", "white")
			.attr("stroke", "#e5e7eb")
			.attr("stroke-width", 2)
			.style("cursor", "pointer")
			.on("click", () => clicked(null, root));

		centerG.append("text")
			.attr("text-anchor", "middle")
			.attr("y", -15)
			.style("font-size", "13px")
			.style("font-weight", "700")
			.style("fill", "#1f2937")
			.text(factors.find(f => f.key === activeFactor)?.label || "");

		centerG.append("text")
			.attr("text-anchor", "middle")
			.attr("y", 5)
			.style("font-size", "18px")
			.style("font-weight", "700")
			.style("fill", "#3b82f6")
			.text(data.length.toLocaleString());

		centerG.append("text")
			.attr("text-anchor", "middle")
			.attr("y", 20)
			.style("font-size", "10px")
			.style("fill", "#6b7280")
			.text("people");

		// CLICK HANDLER (ZOOM)
		let focus = root;

		function clicked(event, p) {
			focus = p;

			root.each(d => {
				d.target = {
					x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
					x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
					y0: Math.max(0, d.y0 - p.y0),
					y1: Math.max(0, d.y1 - p.y0)
				};
			});

			const t = svg.transition().duration(750);

			path
				.transition(t)
				.tween("data", d => {
					const i = d3.interpolate(d.current, d.target);
					return t => (d.current = i(t));
				})
				.attrTween("d", d => () => arc(d.current));

			labelGroup.selectAll("text")
				.transition(t)
				.style("opacity", d => {
					const current = d.current || d;
					return arcVisible(current) ? 1 : 0;
				});
		}

		function arcVisible(d) {
			return d.y1 <= radius && d.y0 >= 0 && (d.x1 - d.x0) > 0.001;
		}
	}
</script>

<style>
.container {
	padding: 2rem;
	background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
	border-radius: 16px;
	box-shadow: 0 4px 12px rgba(0,0,0,0.08);
	max-width: 900px;
	margin: 0 auto;
}

h2 {
	font-size: 26px;
	font-weight: 700;
	color: #1f2937;
	margin: 0 0 1rem 0;
	text-align: center;
}

.subtitle {
	text-align: center;
	color: #6b7280;
	font-size: 14px;
	margin-bottom: 1.5rem;
}

.factor-buttons {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem;
	margin-bottom: 2rem;
	justify-content: center;
}

button.factor {
	padding: 10px 18px;
	border-radius: 24px;
	border: 2px solid #e5e7eb;
	cursor: pointer;
	background: white;
	transition: all 0.2s ease;
	font-size: 14px;
	font-weight: 500;
	color: #374151;
	box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

button.factor:hover {
	border-color: #3b82f6;
	background: #eff6ff;
	transform: translateY(-1px);
	box-shadow: 0 2px 6px rgba(59, 130, 246, 0.15);
}

button.factor.active {
	background: #3b82f6;
	color: white;
	border-color: #3b82f6;
	box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.viz-wrapper {
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.tooltip {
	position: absolute;
	background: rgba(17, 24, 39, 0.95);
	color: white;
	padding: 10px 14px;
	border-radius: 8px;
	font-size: 13px;
	pointer-events: none;
	z-index: 1000;
	box-shadow: 0 4px 12px rgba(0,0,0,0.3);
	max-width: 250px;
	line-height: 1.5;
}

.tooltip-path {
	font-weight: 600;
	margin-bottom: 6px;
	color: #60a5fa;
}

.legend {
	display: flex;
	justify-content: center;
	gap: 2rem;
	margin-top: 1.5rem;
	padding: 1rem;
	background: #f9fafb;
	border-radius: 8px;
	font-size: 13px;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.legend-box {
	width: 14px;
	height: 14px;
	border-radius: 3px;
	border: 1px solid rgba(0,0,0,0.1);
}

:global(svg) {
	overflow: visible;
}
</style>

<div class="container">
	<h2>Lifestyle Factors & Heart Disease</h2>
	<div class="subtitle">
		Click segments to zoom in • Click center to reset • Hover for details
	</div>

	<div class="factor-buttons">
		{#each factors as f}
			<button
				class="factor {activeFactor === f.key ? 'active' : ''}"
				on:click={() => (activeFactor = f.key)}
			>
				{f.label}
			</button>
		{/each}
	</div>

	<div class="viz-wrapper" bind:this={containerEl}>
		<svg bind:this={svgEl} width={width} height={width}></svg>
		
		{#if tooltipData}
			<div class="tooltip" style="left: {tooltipData.x}px; top: {tooltipData.y}px;">
				<div class="tooltip-path">{tooltipData.path}</div>
				<div><strong>Count:</strong> {tooltipData.count} people</div>
				<div><strong>Percentage:</strong> {tooltipData.percentage}%</div>
			</div>
		{/if}
	</div>

	<div class="legend">
		<div class="legend-item">
			<div class="legend-box" style="background: #3b82f6;"></div>
			<span>Outer ring: Main categories</span>
		</div>
		<div class="legend-item">
			<div class="legend-box" style="background: #10b981;"></div>
			<span>Inner ring: Heart disease status</span>
		</div>
	</div>
</div>