export default function HowToGuide() {
  return (
    <div className="max-w-3xl mx-auto text-gray-800 dark:text-gray-200 print:text-black">

      {/* ── Cover ─────────────────────────────────────────────────────────────── */}
      <div className="mb-10 border-b border-gray-200 dark:border-gray-700 pb-8 print:border-gray-400">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">User Guide</p>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white print:text-black">AAIndex Explorer</h1>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400 print:text-gray-600">
              A complete guide to exploring, analysing, and visualising amino acid physicochemical properties.
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Data source: AAIndex database — Kawashima &amp; Kanehisa, Nucleic Acids Research, 2000
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Table of Contents ─────────────────────────────────────────────────── */}
      <div className="mb-10 bg-gray-50 dark:bg-gray-900 print:bg-white border border-gray-200 dark:border-gray-700 print:border-gray-300 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Contents</h2>
        <ol className="space-y-1.5 text-sm">
          {[
            ['1', 'Overview', '#overview'],
            ['2', 'Explorer — Browse & Search Records', '#explorer'],
            ['3', 'Sequence Analysis', '#sequence'],
            ['4', 'Encode — Batch Sequence Encoding', '#encode'],
            ['5', 'Comparator — Side-by-Side Comparison', '#comparator'],
            ['6', 'Visualiser — Charts & Plots', '#visualiser'],
            ['7', 'Property Space — Whole-Database Similarity', '#similarity'],
            ['8', 'Favourites', '#favourites'],
            ['9', 'Exporting Data', '#exporting'],
            ['10', 'Sharing & Reproducibility', '#sharing'],
            ['11', 'API Access', '#api'],
            ['12', 'Citation', '#citation'],
          ].map(([num, title, href]) => (
            <li key={href} className="flex gap-3">
              <span className="text-indigo-500 font-mono font-semibold w-4 shrink-0">{num}</span>
              <a href={href} className="text-indigo-600 dark:text-indigo-400 hover:underline">{title}</a>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Section 1: Overview ───────────────────────────────────────────────── */}
      <section id="overview" className="guide-section mb-12">
        <SectionHeader number="1" title="Overview" />
        <p className="mb-4 leading-relaxed">
          AAIndex Explorer is a browser-based interface for the AAIndex database — a curated collection of
          numerical indices representing physicochemical and biochemical properties of amino acids, as well as
          substitution matrices for sequence analysis.
        </p>
        <p className="mb-4 leading-relaxed">
          The database contains three sub-databases:
        </p>
        <ul className="space-y-2 mb-6">
          <DefItem term="AAIndex1" def="566 numerical indices, one value per amino acid (e.g. hydrophobicity, molecular weight, helix propensity)." />
          <DefItem term="AAIndex2" def="94 amino acid mutation matrices used in pairwise sequence alignment scoring." />
          <DefItem term="AAIndex3" def="47 statistical protein contact potentials representing residue-residue interaction preferences." />
        </ul>
        <p className="leading-relaxed">
          The application is divided into sections accessible from the top navigation bar:
          <strong> Explorer</strong>, <strong>Sequence</strong>, <strong>Encode</strong>,
          <strong> Compare</strong>, <strong>Visualiser</strong>, <strong>Similarity</strong>,
          <strong> API</strong>, <strong>Guide</strong>, and <strong>About</strong>.
        </p>
      </section>

      {/* ── Section 2: Explorer ───────────────────────────────────────────────── */}
      <section id="explorer" className="guide-section mb-12">
        <SectionHeader number="2" title="Explorer — Browse & Search Records" />
        <p className="mb-6 leading-relaxed">
          The Explorer is the main entry point. It lists all records in the active database and provides
          tools for search, filtering, favouriting, and adding records to the comparison queue.
        </p>

        <SubSection title="Switching databases">
          <Steps steps={[
            'Click the database switcher at the top of the Explorer sidebar (AAIndex1 / AAIndex2 / AAIndex3).',
            'The record list updates immediately. All search and filter state resets when you switch.',
          ]} />
        </SubSection>

        <SubSection title="Searching records">
          <Steps steps={[
            'Type any keyword into the search bar — the search runs against accession codes, descriptions, and categories simultaneously.',
            'Results are ranked by relevance using fuzzy matching, so partial or approximate terms still return useful results.',
            'Clear the search bar to return to the full list.',
          ]} />
          <Tip>Search for property keywords like "hydrophobicity", "helix", "charge", or "volume" to find related records across all categories.</Tip>
        </SubSection>

        <SubSection title="Filtering by category">
          <Steps steps={[
            'Use the Category dropdown in the sidebar to restrict the list to a single property category (e.g. "Energy transfer", "Hydrophobicity").',
            'Category filtering combines with the text search — both filters apply simultaneously.',
            'Select "All categories" to remove the filter.',
          ]} />
        </SubSection>

        <SubSection title="Favouriting records">
          <Steps steps={[
            'Click the star icon (☆) on any record card to add it to your favourites.',
            'Click the filled star (★) to remove it.',
            'Enable "Show favourites only" in the sidebar to view only your starred records.',
            'Favourites persist across sessions using your browser\'s local storage.',
          ]} />
        </SubSection>

        <SubSection title="Viewing a record in detail">
          <Steps steps={[
            'Click the accession code or title of any record card to open its detail page.',
            'The detail page shows: the full description, reference, PMID, correlation coefficients with similar records, and a bar chart of values across all 20 amino acids.',
            'Click "PubMed" to open the source publication in a new tab.',
            'Use the "Similar records" section to discover correlated or anti-correlated properties.',
            'An amber ⚠ n/20 badge on a record card means that index has no value for some amino acids — worth noticing before you build features from it.',
          ]} />
        </SubSection>

        <SubSection title="Adding records to compare">
          <Steps steps={[
            'Click the "Add to compare" button on any record card.',
            'A count badge appears on the Compare nav link showing how many records are queued.',
            'You can queue up to 4 records at a time.',
            'A drawer appears at the bottom of the screen showing queued records — click "Compare" to proceed.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 3: Sequence Analysis ──────────────────────────────────────── */}
      <section id="sequence" className="guide-section mb-12">
        <SectionHeader number="3" title="Sequence Analysis" />
        <p className="mb-6 leading-relaxed">
          The Sequence Analysis page encodes a single protein sequence against one or more AAIndex1 properties
          and visualises the result as a line chart or colour-coded heatmap. It contains three tabs.
        </p>

        <SubSection title="Tab 1 — Sequence Encoder">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Maps each residue in a sequence to its numeric property value and plots the result as a line chart.
          </p>
          <Steps steps={[
            'Paste a protein sequence (single-letter code, whitespace is stripped) into the sequence input box.',
            'Select an AAIndex1 record from the list on the left — use the filter input to narrow by accession or description.',
            'The line chart updates in real time. Residues with no data (not covered by the selected index) appear as gaps.',
            'A colour-coded strip below the chart shows each residue letter for sequences up to 100 residues.',
            'Click "↓ CSV" to download the per-position values as a spreadsheet.',
            'No sequence to hand? Enter a UniProt accession or PDB id in the "Fetch by accession" box and click Fetch.',
          ]} />
          <Tip>Unknown characters in your sequence (e.g. ambiguous codes like "B" or "X") are flagged with a warning and rendered as gaps in the chart.</Tip>
        </SubSection>

        <SubSection title="Tab 2 — Sliding Window">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Applies a sliding window average to smooth the property profile — the classic approach for
            hydrophobicity plots (Kyte–Doolittle, 1982).
          </p>
          <Steps steps={[
            'Paste your sequence and select a property as above.',
            'Adjust the window size slider (range 3–25). The default is 9, which matches the original Kyte–Doolittle method.',
            'At each position the displayed value is the mean of the window centred on that residue. Edge positions use a shorter window.',
            'Export the smoothed values via the "↓ CSV" button.',
            'Click "Copy shareable link" to capture the sequence, index and window size in a URL someone else can open.',
          ]} />
          <Tip>Larger window sizes produce smoother curves that emphasise global trends (e.g. transmembrane domains). Smaller windows preserve local peaks.</Tip>
        </SubSection>

        <SubSection title="Tab 3 — Multi-property Heatmap">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Encodes a sequence against multiple indices simultaneously and displays all profiles as a grid
            where colour represents the normalised value at each position.
          </p>
          <Steps steps={[
            'Paste your sequence into the input.',
            'Check or uncheck indices in the list to include or exclude them from the heatmap. Use "Top 10" for a quick selection.',
            'Each row of the heatmap represents one AAIndex1 property; each column is one sequence position.',
            'Colour runs from blue (low) through white to red (high), normalised independently per row.',
            'Hover a cell to see the exact value and residue identity in a tooltip.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 4: Encode ─────────────────────────────────────────────────── */}
      <section id="encode" className="guide-section mb-12">
        <SectionHeader number="4" title="Encode — Batch Sequence Encoding" />
        <p className="mb-6 leading-relaxed">
          The Encode page processes entire FASTA files or plain-text sequence lists and encodes all sequences
          against a selected AAIndex1 property. It is designed for batch workflows where you need to generate
          feature vectors for machine learning or downstream analysis.
        </p>

        <SubSection title="Uploading sequences">
          <Steps steps={[
            'Click the upload area or drag-and-drop a file onto it. Accepted formats: .fasta, .fa, .txt.',
            'FASTA files: sequences are separated by ">" header lines. The first word after ">" is used as the sequence ID.',
            'Plain text files: one sequence per line. Sequences are automatically assigned IDs (seq_1, seq_2, …).',
            'Invalid lines with no recognisable amino acid characters are skipped and listed in an amber panel with the reason.',
            'Alternatively, enter a UniProt accession or PDB id (chain optional, e.g. 1CRN_A) in the "Fetch by accession" box.',
            'Uploads are capped at 5 MB. Very large sequence sets render in the table 200 rows at a time.',
          ]} />
          <Tip>Sequences are uppercased on import. Whitespace within lines is stripped. Ambiguous residues are accepted but will produce null values in the encoding.</Tip>
        </SubSection>

        <SubSection title="Selecting an AAIndex1 record">
          <Steps steps={[
            'Use the filter input in the left sidebar to search records by accession or description.',
            'Click any record in the list to select it as the encoding property.',
            'The preview chart and sequence table update immediately.',
            'Your starred records appear in the Favourites panel (click the arrow to expand) for quick access.',
          ]} />
        </SubSection>

        <SubSection title="Reading the preview">
          <Steps steps={[
            'The preview panel shows a line chart of the first (or selected) sequence\'s encoded values.',
            'The actual protein sequence is shown in a scrollable monospace box directly above the chart.',
            'The sequence table lists all loaded sequences with their length and a summary of encoding statistics (valid residues · mean value).',
            'Click any row in the table to load that sequence into the preview chart.',
            'For multi-sequence files a dropdown also appears in the preview header for quick switching.',
          ]} />
        </SubSection>

        <SubSection title="Exporting">
          <Steps steps={[
            '"↓ All encodings (long CSV)" — one row per residue per sequence. Columns: sequence_id, position, amino_acid, value.',
            '"↓ Summary stats CSV" — one row per sequence. Columns: sequence_id, length, valid_residues, mean, min, max.',
            '"↓ pySAR descriptor set" — a dataset CSV (sequence plus an empty activity column to fill in) and a config JSON naming the AAIndex indices, ready to hand to pySAR.',
            '"🔗 Copy shareable link" — captures the selected index, and a single loaded sequence, in the URL.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 5: Comparator ─────────────────────────────────────────────── */}
      <section id="comparator" className="guide-section mb-12">
        <SectionHeader number="5" title="Comparator — Side-by-Side Comparison" />
        <p className="mb-6 leading-relaxed">
          The Comparator lets you place up to four AAIndex1 records side by side in a table and examine how
          property values differ across all 20 amino acids.
        </p>

        <SubSection title="Building the comparison set">
          <Steps steps={[
            'Navigate to the Explorer and click "Add to compare" on each record you want to include (maximum 4).',
            'The sticky drawer at the bottom of the screen shows queued records.',
            'Click "Compare" in the drawer, or navigate directly to the Compare page from the navbar.',
            'Records can also be removed from the drawer by clicking the × next to their accession.',
          ]} />
        </SubSection>

        <SubSection title="Reading the comparison table">
          <Steps steps={[
            'Each column represents one AAIndex1 record; each row is one amino acid.',
            'Toggle "Normalise (z-score)" to scale all values to comparable z-scores — useful when records use different units.',
            'Values are colour-coded within each column: dark blue = high, dark red = low, grey = missing.',
            'Click any column header to sort by that property.',
          ]} />
        </SubSection>

        <SubSection title="Exporting comparisons">
          <Steps steps={[
            'Click "↓ CSV" to download the full comparison table.',
            'Click "↓ JSON" to export the raw record data for all queued accessions.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 6: Visualiser ─────────────────────────────────────────────── */}
      <section id="visualiser" className="guide-section mb-12">
        <SectionHeader number="6" title="Visualiser — Charts & Plots" />
        <p className="mb-6 leading-relaxed">
          The Visualiser provides interactive charts for a single record or a pair of records.
          Select a chart type from the left sidebar, choose your record(s), and export as PNG or CSV.
        </p>

        <SubSection title="Bar chart">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Shows all 20 amino acid values for one AAIndex1 record as a coloured bar chart.
          </p>
          <Steps steps={[
            'Select "Bar chart" from the chart type list.',
            'Choose a record using the filter and select list in the sidebar.',
            'Positive values are shaded blue (darker = larger); negative values are shaded red.',
            'Missing values render as grey bars.',
            'Hover any bar to see the full amino acid name and exact value.',
            'Export with "↓ CSV" (values table) or "↓ PNG" (chart image).',
          ]} />
        </SubSection>

        <SubSection title="Radar chart">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Displays the 20 amino acid values radially — useful for comparing the profile shape between two records.
          </p>
          <Steps steps={[
            'Select "Radar chart".',
            'Optionally tick "Overlay second record" to add a second series in green.',
            'Values are normalised to [0, 1] per record before plotting so both series are comparable regardless of scale.',
            'Hover the chart to see raw values per amino acid.',
          ]} />
        </SubSection>

        <SubSection title="Matrix heatmap">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Renders an AAIndex2 or AAIndex3 substitution / contact potential matrix as a colour grid.
          </p>
          <Steps steps={[
            'Select "Matrix heatmap".',
            'Choose AAIndex2 (mutation matrices) or AAIndex3 (contact potentials) from the database buttons.',
            'Select a matrix record. The 20×20 grid renders with positive scores in blue and negative in red.',
            'Hover any cell to see the row/column amino acids and the score.',
            'Export the full matrix as CSV.',
          ]} />
        </SubSection>

        <SubSection title="Property scatter">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Plots all 20 amino acids as labelled points in a 2D space defined by two AAIndex1 properties.
            Dashed crosshairs mark the mean of each axis.
          </p>
          <Steps steps={[
            'Select "Property scatter".',
            'Choose the X axis record from the top selector and the Y axis record from the second selector.',
            'Each point is labelled with the single-letter amino acid code.',
            'Hover a point for the full name and both property values.',
            'Amino acids in the same quadrant share similar values on both properties — useful for understanding co-variation.',
          ]} />
          <Tip>Try pairing hydrophobicity (KYTJ820101) on one axis with molecular weight (FASG760101) or charge (ZIMJ680104) on the other to reveal physicochemical clusters.</Tip>
        </SubSection>
      </section>

      {/* ── Section 7: Favourites ─────────────────────────────────────────────── */}
      <section id="similarity" className="guide-section mb-12">
        <SectionHeader number="7" title="Property Space — Whole-Database Similarity" />
        <p className="mb-6 leading-relaxed">
          AAIndex1 ships correlation coefficients for some pairs of records, but not all of them. The
          Property Space page derives similarity for the whole database instead: every record is projected
          onto the first two principal components of its 20 amino-acid values, so indices that measure the
          same underlying property land near each other.
        </p>

        <SubSection title="Reading the plot">
          <Steps steps={[
            'Each point is one AAIndex1 record. Points close together describe similar properties.',
            'Colour encodes the record category — the legend below the plot doubles as a filter.',
            'The axis labels show how much of the total variance each component captures.',
            'Hover any point to see its accession, description, and category.',
          ]} />
          <Tip>Values are standardised before the projection, so a property measured in kcal/mol does not swamp one measured in cubic ångströms.</Tip>
        </SubSection>

        <SubSection title="Finding neighbours">
          <Steps steps={[
            'Click a point to pin it. The sidebar then lists its most correlated records.',
            'Correlations are computed live across all 20 values, covering every record — not only the pairs AAIndex ships coefficients for.',
            'A positive r means the two indices rank amino acids the same way; a negative r means they are inverses of each other.',
            'Click any neighbour to pin it instead, or "Open" to jump to the pinned record\u2019s detail page.',
          ]} />
        </SubSection>

        <SubSection title="Filtering by category">
          <Steps steps={[
            'Use the sidebar dropdown, or click a colour swatch in the legend, to show one category at a time.',
            'The projection itself is computed once over the whole database, so the axes stay comparable whichever category you view.',
            'Click the active swatch again to clear the filter.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 8: Favourites ─────────────────────────────────────────────── */}
      <section id="favourites" className="guide-section mb-12">
        <SectionHeader number="8" title="Favourites" />
        <p className="mb-4 leading-relaxed">
          Favourites are accessible across the entire application and persist between sessions.
        </p>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li className="flex gap-2"><span className="text-indigo-500 font-bold shrink-0">·</span><span><strong>Explorer:</strong> Star any record card. Use "Show favourites only" to filter to starred records.</span></li>
          <li className="flex gap-2"><span className="text-indigo-500 font-bold shrink-0">·</span><span><strong>Record Detail:</strong> Star or unstar the current record from its detail page.</span></li>
          <li className="flex gap-2"><span className="text-indigo-500 font-bold shrink-0">·</span><span><strong>Encode page:</strong> The Favourites panel in the left sidebar expands to show your starred records. Click any to instantly select it as the active encoding property.</span></li>
        </ul>
      </section>

      {/* ── Section 8: Exporting ──────────────────────────────────────────────── */}
      <section id="exporting" className="guide-section mb-12">
        <SectionHeader number="9" title="Exporting Data" />
        <div className="overflow-x-auto">
          <table className="text-sm w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600 print:border-gray-400">
                <th className="text-left py-2 pr-6 font-semibold text-gray-600 dark:text-gray-400">Location</th>
                <th className="text-left py-2 pr-6 font-semibold text-gray-600 dark:text-gray-400">Format</th>
                <th className="text-left py-2 font-semibold text-gray-600 dark:text-gray-400">Contents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
              {[
                ['Explorer / Record Detail', 'CSV', 'All 20 amino acid values for one record'],
                ['Explorer / Record Detail', 'JSON', 'Full record metadata + values'],
                ['Explorer / Record Detail', 'AAIndex', 'Canonical AAIndex flat-file format (whole DB)'],
                ['Sequence Analysis — Encoder', 'CSV', 'Per-position: position, amino acid, property value'],
                ['Sequence Analysis — Window', 'CSV', 'Per-position smoothed values'],
                ['Encode', 'CSV (long)', 'All sequences × all positions with property value'],
                ['Encode', 'CSV (summary)', 'Per-sequence: length, valid count, mean, min, max'],
                ['Encode', 'pySAR set', 'Dataset CSV + config JSON naming the AAIndex indices'],
                ['Comparator', 'CSV', 'All amino acids × all queued records'],
                ['Comparator', 'JSON', 'Raw record data for all queued accessions'],
                ['Visualiser (bar / radar / scatter)', 'CSV', 'Property values for selected record(s)'],
                ['Visualiser (matrix heatmap)', 'CSV', 'Full substitution matrix'],
                ['Any chart', 'PNG', 'Chart snapshot at screen resolution'],
                ['API list endpoints', 'CSV / TSV', 'Add ?format=csv or ?format=tsv to any list endpoint'],
                ['API /api/window', 'CSV / TSV', 'Per-position raw and window-averaged values'],
              ].map(([loc, fmt, desc]) => (
                <tr key={loc + fmt + desc}>
                  <td className="py-2 pr-6 text-gray-700 dark:text-gray-300 print:text-gray-700">{loc}</td>
                  <td className="py-2 pr-6 font-mono text-indigo-600 dark:text-indigo-400">{fmt}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400 print:text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 10: Sharing ───────────────────────────────────────────────── */}
      <section id="sharing" className="guide-section mb-12">
        <SectionHeader number="10" title="Sharing & Reproducibility" />
        <p className="mb-6 leading-relaxed">
          Explorer, Sequence Analysis, Encode and Property Space all keep their state in the page URL. That
          makes any view a link — one you can bookmark, send to a collaborator, or cite in a paper so a reader
          reproduces exactly the analysis you describe.
        </p>

        <SubSection title="What each page captures">
          <div className="overflow-x-auto">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600 print:border-gray-400">
                  <th className="text-left py-2 pr-6 font-semibold text-gray-600 dark:text-gray-400">Page</th>
                  <th className="text-left py-2 font-semibold text-gray-600 dark:text-gray-400">Query parameters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                {[
                  ['Explorer', 'db, q, cat, page'],
                  ['Sequence Analysis', 'tab, seq, acc, w, idx'],
                  ['Encode', 'acc, seq, id'],
                  ['Property Space', 'acc, cat'],
                ].map(([page, params]) => (
                  <tr key={page}>
                    <td className="py-2 pr-6 text-gray-700 dark:text-gray-300 print:text-gray-700">{page}</td>
                    <td className="py-2 font-mono text-indigo-600 dark:text-indigo-400 text-xs">{params}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Tip>Use the "🔗 Copy shareable link" button rather than copying the address bar — it guarantees the URL is current. Sequences longer than 2,000 residues are kept in the page instead of the URL, so share those as a FASTA file or a UniProt/PDB accession.</Tip>
        </SubSection>

        <SubSection title="Embedding a record">
          <Steps steps={[
            'Open any record detail page and click "</> Get embed code".',
            'An <iframe> snippet is copied to your clipboard; paste it into a page, wiki or lab notebook.',
            'Record pages are the only routes that permit framing — the rest of the app refuses it.',
          ]} />
        </SubSection>
      </section>

      {/* ── Section 11: API ───────────────────────────────────────────────────── */}
      <section id="api" className="guide-section mb-12">
        <SectionHeader number="11" title="API Access" />
        <p className="mb-6 leading-relaxed">
          Everything in the app is backed by a public, read-only REST API. No key, no auth, CORS open to any
          origin. The <a href="/api-reference" className="text-indigo-600 dark:text-indigo-400 hover:underline">API Reference</a> page
          documents every endpoint with a live "Try it" box, and <a href="/api/openapi" className="text-indigo-600 dark:text-indigo-400 hover:underline">/api/openapi</a> serves
          the same information as a machine-readable OpenAPI 3.1 document.
        </p>

        <SubSection title="Common calls">
          <div className="overflow-x-auto">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600 print:border-gray-400">
                  <th className="text-left py-2 pr-6 font-semibold text-gray-600 dark:text-gray-400">Endpoint</th>
                  <th className="text-left py-2 font-semibold text-gray-600 dark:text-gray-400">Returns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                {[
                  ['GET /api/search?q=hydrophobicity', 'Matches across all three databases, tagged by source'],
                  ['GET /api/aaindex1?category=hydrophobic', 'Filtered record list — add &format=csv for a table'],
                  ['GET /api/aaindex1/KYTJ820101', 'One full record with values and citation data'],
                  ['GET /api/window?accession=…&sequence=…&window=7', 'Sliding-window property profile'],
                  ['GET /api/sequence?id=P01308', 'Sequence fetched from UniProt or the PDB'],
                  ['POST /api/encode', 'One sequence encoded against up to 50 indices'],
                ].map(([ep, ret]) => (
                  <tr key={ep}>
                    <td className="py-2 pr-6 font-mono text-indigo-600 dark:text-indigo-400 text-xs">{ep}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400 print:text-gray-600">{ret}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Tip>Accession codes are case-insensitive. Successful responses are edge-cached for 24 hours; errors are never cached, so a transient upstream failure clears on the next request.</Tip>
        </SubSection>
      </section>

      {/* ── Section 12: Citation ──────────────────────────────────────────────── */}
      <section id="citation" className="guide-section mb-12">
        <SectionHeader number="12" title="Citation" />
        <p className="mb-4 leading-relaxed text-sm">
          If you use AAIndex Explorer or data derived from the AAIndex database in your research, please cite
          the original AAIndex publication:
        </p>
        <blockquote className="border-l-4 border-indigo-400 pl-4 py-2 bg-gray-50 dark:bg-gray-900 print:bg-white rounded-r-lg text-sm leading-relaxed mb-6">
          <p>Kawashima, S. and Kanehisa, M.</p>
          <p className="italic mt-1">"AAindex: amino acid index database."</p>
          <p className="mt-1">Nucleic Acids Research, 28(1): 374, 2000.</p>
          <p className="mt-1 text-gray-500">PMID: 10592278 · DOI: 10.1093/nar/28.1.374</p>
        </blockquote>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The AAIndex database is maintained by the Kanehisa Laboratories and is freely available at
          {' '}<span className="font-mono text-indigo-600 dark:text-indigo-400">https://www.genome.jp/aaindex/</span>.
        </p>
      </section>

    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3 border-b border-gray-200 dark:border-gray-700 print:border-gray-400 pb-2">
      <span className="text-3xl font-bold text-indigo-500 font-mono">{number}</span>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">{title}</h2>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-black mb-3 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 mb-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center print:bg-white print:border print:border-indigo-400 print:text-indigo-600">
            {i + 1}
          </span>
          <span className="text-gray-700 dark:text-gray-300 print:text-gray-700">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 dark:bg-amber-950 print:bg-white border border-amber-200 dark:border-amber-800 print:border-amber-400 rounded-lg px-3 py-2 text-xs text-amber-800 dark:text-amber-300 print:text-amber-900 mt-2">
      <span className="font-bold shrink-0">Tip:</span>
      <span>{children}</span>
    </div>
  )
}

function DefItem({ term, def }: { term: string; def: string }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 w-24">{term}</span>
      <span className="text-gray-700 dark:text-gray-300 print:text-gray-700">{def}</span>
    </li>
  )
}
