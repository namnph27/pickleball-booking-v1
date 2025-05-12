/**
 * Script to delete sample data from the database
 * This script will delete all sample users, courts, and related data
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new pool with connection details
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'HoaiNam',
  database: process.env.DB_NAME || 'pickleball_v1'
});

// Delete all courts for a specific owner
async function deleteCourtsByOwner(client, ownerId) {
  try {
    // Get all courts for this owner
    const courtsQuery = `
      SELECT id, name FROM courts
      WHERE owner_id = $1
    `;

    const courtsResult = await client.query(courtsQuery, [ownerId]);
    const courts = courtsResult.rows;

    if (courts.length === 0) {
      console.log(`No courts found for owner ID ${ownerId}.`);
      return 0;
    }

    console.log(`Found ${courts.length} courts for owner ID ${ownerId}:`);
    courts.forEach(court => {
      console.log(`- ${court.name} (ID: ${court.id})`);
    });

    // Get the IDs of the courts
    const courtIds = courts.map(court => court.id);

    // Delete related data first (due to foreign key constraints)

    // 1. Delete court timeslots
    const deleteTimeslotsQuery = `
      DELETE FROM court_timeslots
      WHERE court_id = ANY($1::int[])
    `;
    const timeslotsResult = await client.query(deleteTimeslotsQuery, [courtIds]);
    console.log(`Deleted ${timeslotsResult.rowCount} court timeslots.`);

    // 2. Delete bookings and related data
    // First, get all booking IDs for these courts
    const bookingsQuery = `
      SELECT id FROM bookings
      WHERE court_id = ANY($1::int[])
    `;
    const bookingsResult = await client.query(bookingsQuery, [courtIds]);
    const bookingIds = bookingsResult.rows.map(row => row.id);

    if (bookingIds.length > 0) {
      // Delete booking-related data
      const deletePaymentsQuery = `
        DELETE FROM payments
        WHERE booking_id = ANY($1::int[])
      `;
      const paymentsResult = await client.query(deletePaymentsQuery, [bookingIds]);
      console.log(`Deleted ${paymentsResult.rowCount} payments.`);

      // Delete booking join requests if they exist
      try {
        const deleteJoinRequestsQuery = `
          DELETE FROM booking_join_requests
          WHERE booking_id = ANY($1::int[])
        `;
        const joinRequestsResult = await client.query(deleteJoinRequestsQuery, [bookingIds]);
        console.log(`Deleted ${joinRequestsResult.rowCount} booking join requests.`);
      } catch (error) {
        // Table might not exist in some installations
        console.log('Note: booking_join_requests table might not exist, skipping.');
      }

      // Delete booking players if they exist
      try {
        const deletePlayersQuery = `
          DELETE FROM booking_players
          WHERE booking_id = ANY($1::int[])
        `;
        const playersResult = await client.query(deletePlayersQuery, [bookingIds]);
        console.log(`Deleted ${playersResult.rowCount} booking players.`);
      } catch (error) {
        // Table might not exist in some installations
        console.log('Note: booking_players table might not exist, skipping.');
      }

      // Now delete the bookings
      const deleteBookingsQuery = `
        DELETE FROM bookings
        WHERE id = ANY($1::int[])
      `;
      const deleteBookingsResult = await client.query(deleteBookingsQuery, [bookingIds]);
      console.log(`Deleted ${deleteBookingsResult.rowCount} bookings.`);
    } else {
      console.log('No bookings found for these courts.');
    }

    // 3. Finally, delete the courts
    const deleteCourtsQuery = `
      DELETE FROM courts
      WHERE id = ANY($1::int[])
    `;
    const deleteCourtsResult = await client.query(deleteCourtsQuery, [courtIds]);
    console.log(`Deleted ${deleteCourtsResult.rowCount} courts for owner ID ${ownerId}.`);

    return deleteCourtsResult.rowCount;
  } catch (error) {
    console.error(`Error deleting courts for owner ID ${ownerId}:`, error);
    throw error;
  }
}

// Delete sample users and all their data
async function deleteSampleUsers() {
  const client = await pool.connect();

  try {
    console.log('Deleting sample users and their data...');

    // Start a transaction
    await client.query('BEGIN');

    // Get list of sample users (users created by the sample script)
    // We'll identify them by their emails which contain "@example.com"
    const sampleUsersQuery = `
      SELECT id, name, email, role FROM users
      WHERE email LIKE '%@example.com'
    `;

    const usersResult = await client.query(sampleUsersQuery);
    const sampleUsers = usersResult.rows;

    if (sampleUsers.length === 0) {
      console.log('No sample users found to delete.');
      await client.query('COMMIT');
      return;
    }

    console.log(`Found ${sampleUsers.length} sample users to delete:`);
    sampleUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) with role ${user.role}`);
    });

    // Process court owners first to delete their courts
    const courtOwners = sampleUsers.filter(user => user.role === 'court_owner');
    let totalCourtsDeleted = 0;

    for (const owner of courtOwners) {
      const courtsDeleted = await deleteCourtsByOwner(client, owner.id);
      totalCourtsDeleted += courtsDeleted;
    }

    // Get the IDs of all sample users
    const userIds = sampleUsers.map(user => user.id);

    // Delete user-related data

    // 1. Delete notifications
    try {
      const deleteNotificationsQuery = `
        DELETE FROM notifications
        WHERE user_id = ANY($1::int[])
      `;
      const notificationsResult = await client.query(deleteNotificationsQuery, [userIds]);
      console.log(`Deleted ${notificationsResult.rowCount} notifications.`);
    } catch (error) {
      console.log('Note: notifications table might not exist or have no entries, skipping.');
    }

    // 2. Delete reward history if it exists
    try {
      const deleteRewardsQuery = `
        DELETE FROM reward_history
        WHERE user_id = ANY($1::int[])
      `;
      const rewardsResult = await client.query(deleteRewardsQuery, [userIds]);
      console.log(`Deleted ${rewardsResult.rowCount} reward history entries.`);
    } catch (error) {
      console.log('Note: reward_history table might not exist, skipping.');
    }

    // 3. Delete bookings made by these users
    const userBookingsQuery = `
      SELECT id FROM bookings
      WHERE user_id = ANY($1::int[])
    `;
    const userBookingsResult = await client.query(userBookingsQuery, [userIds]);
    const userBookingIds = userBookingsResult.rows.map(row => row.id);

    if (userBookingIds.length > 0) {
      // Delete booking-related data
      const deletePaymentsQuery = `
        DELETE FROM payments
        WHERE booking_id = ANY($1::int[])
      `;
      const paymentsResult = await client.query(deletePaymentsQuery, [userBookingIds]);
      console.log(`Deleted ${paymentsResult.rowCount} payments for user bookings.`);

      // Delete booking join requests if they exist
      try {
        const deleteJoinRequestsQuery = `
          DELETE FROM booking_join_requests
          WHERE booking_id = ANY($1::int[])
        `;
        const joinRequestsResult = await client.query(deleteJoinRequestsQuery, [userBookingIds]);
        console.log(`Deleted ${joinRequestsResult.rowCount} booking join requests.`);
      } catch (error) {
        console.log('Note: booking_join_requests table might not exist, skipping.');
      }

      // Delete booking players if they exist
      try {
        const deletePlayersQuery = `
          DELETE FROM booking_players
          WHERE booking_id = ANY($1::int[])
        `;
        const playersResult = await client.query(deletePlayersQuery, [userBookingIds]);
        console.log(`Deleted ${playersResult.rowCount} booking players.`);
      } catch (error) {
        console.log('Note: booking_players table might not exist, skipping.');
      }

      // Now delete the bookings
      const deleteBookingsQuery = `
        DELETE FROM bookings
        WHERE id = ANY($1::int[])
      `;
      const deleteBookingsResult = await client.query(deleteBookingsQuery, [userBookingIds]);
      console.log(`Deleted ${deleteBookingsResult.rowCount} bookings made by sample users.`);
    } else {
      console.log('No bookings found for sample users.');
    }

    // 4. Finally, delete the users
    const deleteUsersQuery = `
      DELETE FROM users
      WHERE id = ANY($1::int[])
    `;
    const deleteUsersResult = await client.query(deleteUsersQuery, [userIds]);
    console.log(`Deleted ${deleteUsersResult.rowCount} sample users.`);

    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Sample users and related data deleted successfully. Total courts deleted: ${totalCourtsDeleted}`);
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting sample users:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Delete any remaining sample courts
async function deleteRemainingSampleCourts() {
  const client = await pool.connect();

  try {
    console.log('Checking for any remaining sample courts...');

    // Start a transaction
    await client.query('BEGIN');

    // Get list of sample courts by name pattern
    const sampleCourtsQuery = `
      SELECT id, name, owner_id FROM courts
      WHERE name LIKE 'Sân Pickleball%' OR name LIKE 'Sân %'
    `;

    const courtsResult = await client.query(sampleCourtsQuery);
    const sampleCourts = courtsResult.rows;

    if (sampleCourts.length === 0) {
      console.log('No remaining sample courts found.');
      await client.query('COMMIT');
      return;
    }

    console.log(`Found ${sampleCourts.length} remaining sample courts to delete:`);
    sampleCourts.forEach(court => {
      console.log(`- ${court.name} (ID: ${court.id}, Owner ID: ${court.owner_id})`);
    });

    // Get the IDs of the sample courts
    const courtIds = sampleCourts.map(court => court.id);

    // Delete related data first

    // 1. Delete court timeslots
    const deleteTimeslotsQuery = `
      DELETE FROM court_timeslots
      WHERE court_id = ANY($1::int[])
    `;
    const timeslotsResult = await client.query(deleteTimeslotsQuery, [courtIds]);
    console.log(`Deleted ${timeslotsResult.rowCount} court timeslots.`);

    // 2. Delete bookings and related data
    const bookingsQuery = `
      SELECT id FROM bookings
      WHERE court_id = ANY($1::int[])
    `;
    const bookingsResult = await client.query(bookingsQuery, [courtIds]);
    const bookingIds = bookingsResult.rows.map(row => row.id);

    if (bookingIds.length > 0) {
      // Delete booking-related data
      const deletePaymentsQuery = `
        DELETE FROM payments
        WHERE booking_id = ANY($1::int[])
      `;
      const paymentsResult = await client.query(deletePaymentsQuery, [bookingIds]);
      console.log(`Deleted ${paymentsResult.rowCount} payments.`);

      // Delete booking join requests if they exist
      try {
        const deleteJoinRequestsQuery = `
          DELETE FROM booking_join_requests
          WHERE booking_id = ANY($1::int[])
        `;
        const joinRequestsResult = await client.query(deleteJoinRequestsQuery, [bookingIds]);
        console.log(`Deleted ${joinRequestsResult.rowCount} booking join requests.`);
      } catch (error) {
        console.log('Note: booking_join_requests table might not exist, skipping.');
      }

      // Delete booking players if they exist
      try {
        const deletePlayersQuery = `
          DELETE FROM booking_players
          WHERE booking_id = ANY($1::int[])
        `;
        const playersResult = await client.query(deletePlayersQuery, [bookingIds]);
        console.log(`Deleted ${playersResult.rowCount} booking players.`);
      } catch (error) {
        console.log('Note: booking_players table might not exist, skipping.');
      }

      // Now delete the bookings
      const deleteBookingsQuery = `
        DELETE FROM bookings
        WHERE id = ANY($1::int[])
      `;
      const deleteBookingsResult = await client.query(deleteBookingsQuery, [bookingIds]);
      console.log(`Deleted ${deleteBookingsResult.rowCount} bookings.`);
    } else {
      console.log('No bookings found for these courts.');
    }

    // 3. Finally, delete the courts
    const deleteCourtsQuery = `
      DELETE FROM courts
      WHERE id = ANY($1::int[])
    `;
    const deleteCourtsResult = await client.query(deleteCourtsQuery, [courtIds]);
    console.log(`Deleted ${deleteCourtsResult.rowCount} remaining sample courts.`);

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Remaining sample courts and related data deleted successfully.');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting remaining sample courts:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the deletion process
async function deleteSampleData() {
  try {
    // First delete sample users (which will also delete their courts)
    await deleteSampleUsers();

    // Then delete any remaining sample courts
    await deleteRemainingSampleCourts();

    console.log('Sample data deletion completed successfully');
  } catch (error) {
    console.error('Sample data deletion failed:', error);
  } finally {
    await pool.end();
  }
}

deleteSampleData();
