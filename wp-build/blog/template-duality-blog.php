<?php
/**
 * Template Name: Duality Blog (2026 design)
 *
 * Blog landing page in the approved 2026 design: homepage header, a dark title band, the newest
 * post as a feature, then a three-column grid with pagination, the CTA band and the footer.
 * Page 1 shows 1 feature + 9 cards; later pages show 9 cards each.
 */

if (!defined('ABSPATH')) {
	exit;
}

require_once get_stylesheet_directory() . '/duality-home/blog-functions.php';
dh_blog_assets();

$paged     = max(1, (int) get_query_var('paged'), (int) get_query_var('page'));
$first_n   = 10;
$per_page  = 9;
$offset    = $paged === 1 ? 0 : $first_n + ($paged - 2) * $per_page;
$query     = new WP_Query([
	'post_type'           => 'post',
	'post_status'         => 'publish',
	'posts_per_page'      => $paged === 1 ? $first_n : $per_page,
	'offset'              => $offset,
	'ignore_sticky_posts' => true,
	'no_found_rows'       => false,
]);
$total       = (int) $query->found_posts;
$total_pages = $total <= $first_n ? 1 : 1 + (int) ceil(($total - $first_n) / $per_page);
$posts       = $query->posts;

dh_head('duality-blog');
?>

<section class="blog-hero on-dark">
  <svg class="ghost-d" width="640" height="640" style="color:#fff" aria-hidden="true"><use href="#emblem"/></svg>
  <div class="wrap">
    <div class="eyebrow">From the salon</div>
    <h1>The Duality <em>Journal</em></h1>
    <p class="sub">Color, care and styling advice from Sue, Leah and the team at Duality Salon in Williamsville, NY.</p>
  </div>
</section>

<section class="blog-list">
  <div class="wrap">
    <?php if (!$posts) : ?>
      <p class="blog-empty">New articles are on the way. In the meantime, <a href="https://login.meevo.com/DualitySalonBuffalo/ob?locationId=105068" target="_blank" rel="noopener">book online</a> or call us at <a href="tel:+17169988528">(716) 998-8528</a>.</p>
    <?php else : ?>
      <?php
      if ($paged === 1) {
          echo dh_post_card(array_shift($posts), 'is-feature'); // phpcs:ignore WordPress.Security.EscapeOutput -- escaped inside
      }
      ?>
      <div class="post-grid">
        <?php foreach ($posts as $p) { echo dh_post_card($p); } // phpcs:ignore WordPress.Security.EscapeOutput ?>
      </div>
      <?php if ($total_pages > 1) : ?>
        <nav class="pager" aria-label="Blog pages">
          <?php
          echo paginate_links([ // phpcs:ignore WordPress.Security.EscapeOutput
              'base'      => trailingslashit(get_permalink()) . 'page/%#%/',
              'format'    => '',
              'current'   => $paged,
              'total'     => $total_pages,
              'prev_text' => '&larr; Newer',
              'next_text' => 'Older &rarr;',
          ]);
          ?>
        </nav>
      <?php endif; ?>
    <?php endif; ?>
  </div>
</section>

<?php
wp_reset_postdata();
dh_foot();
