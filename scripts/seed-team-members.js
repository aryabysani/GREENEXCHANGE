// Run: node scripts/seed-team-members.js
// Updates team_members for each stall profile

const SUPABASE_URL = 'https://bsquxyfpkvrglghpehpp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXV4eWZwa3ZyZ2xnaHBlaHBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc2MTI4MywiZXhwIjoyMDg5MzM3MjgzfQ.j1VBZmEKZCwBA3vTAZITNh8srFYuybAdlTZNsbxXyfY'

const TEAM_DATA = {
  stall01: ['Rishav Ranjan', 'Kyati Shetty', 'Gauri Mishra', 'Atharva Wagh', 'G M S P Vyshnav Abhishikth', 'Y Kailesh', 'Adrija Nambiar', 'Manya Murlidhar', 'Aditya Sharma', 'Sreeparvathi K Gheeshkar', 'Ashmit Wadhwa', 'Krish Kumar'],
  stall02: ['Liesha Arora', 'Vigilapuram Naina', 'Yash Gaurav', 'Mohammad Saad', 'Venkata Harshith Jonna', 'Yelakala Parthiv Reddy', 'Venkatakrishnan Venkataraman', 'Sampadha Raju', 'Sarvin Khawasia', 'Stuti Mishra', 'Devansh Kedia'],
  stall03: ['Joshua Varghese Georgei', 'Pragyashree Chattopadhyay', 'Aishwarya Lakshmi Gunda', 'Achut Santhosh', 'Arihant Dalal', 'Rishika R Bhosle', 'Aryan Raj', 'Ananya Misra', 'Somya Bansal', 'Ruhaan Anand'],
  stall04: ['Akiv Gupte', 'Adwaid Sajith', 'Kushmitha Nemani', 'Gururaj Anagawadi', 'Yagya Puri', 'Neel Adhikary', 'Kritika Choudhary', 'Devina', 'Abhinav Karthik', 'Alluri Venkata Sashank Varma'],
  stall05: ['Himank Mitra', 'R Murali Priya', 'Kushal Gupta', 'Kinshuk Joshi', 'Aditya Singh', 'Drishti Gulati', 'Giannah Mahtani', 'Jaspreet Singh', 'Kunal Kishore', 'Prithish Dhume'],
  stall06: ['Aditya Gothi', 'Anirudh S Kiran', 'Mythri M', 'Tarrun Menon', 'Shobhit Das', 'Gunnika', 'Findoriya Veer', 'Arjun Kenjale', 'Ishaan Chobey'],
  stall07: ['Gouri Sangurmath', 'Rishav Agrawal', 'Debolina', 'Surya Raj Karthick', 'Div Mehta', 'Bandaru Nandita Bandaru', 'Vinay Pratap Singh', 'Palak', 'Prasang Pandey', 'Ritisha Biswas', 'Prithvi Mishra', 'Aarush Kalra'],
  stall08: ['Chandana B Raj V', 'Atharva Bisen', 'Lakshya Sahu', 'Aditya Singh', 'Mohammed Hamza Mansuri', 'Arya Bysani Rakesh', 'Meenakshi Rajesh', 'Nithya sree Amirtharaj', 'Omi Sharma', 'Vaibhav Singh'],
  stall09: ['V Prerana', 'Dhruv Arvind Mahadik', 'Shruti Singh', 'Sumukha Shetty', 'Laasini Bellala', 'Arnavi Khandelwal', 'Rishav Mishra', 'Dhananjay Batra', 'Neel Gupta'],
  stall10: ['Rishon Gangadhariah Anand', 'Simran Wadhwa', 'Ruhaani Gulati', 'Pranav Krishnamurthi', 'Jeevan Lokesh', 'Pakhi Vijay', 'Shreshth Singhal', 'Somenath Chakraborty', 'Kian Byramji', 'Devna Ajin', 'Naman Tyagi'],
  stall11: ['Dhanush Ramanan', 'Shruti Sneh', 'Suryansh Das', 'Rasagnya Reddy Pellakuru', 'Atharv Gautam', 'Aishwarya Rao Nandicoor', 'Archie Atul Bansal', 'Kushagra Vats', 'Mananjot Narang', 'Navaneetha V P'],
  stall12: ['Avni Jain', 'Jyothi Swaroop R', 'Thrijal Miryala', 'Anutthama Rajagopalan', 'Nasim Mohammed', 'Aatreyi Subramoniam', 'Bhanu Mishra', 'Ayush Chourasia', 'Krish Patel A M', 'Pratishtha Vishwakarma'],
  stall13: ['Sahasra Reddy', 'Tashvi Singh', 'Diksha Goyal', 'Dhruv Shivakumar', 'Harshit Dubey', 'Varnika Goenka', 'Tithiksha Shripad', 'Roushni Pandey', 'Prateek Dash', 'Shashank Modi', 'Gur Ahad Singh'],
  stall14: ['Jasmira Kaur Takkar', 'Jagrav Singh Yadav', 'Aaron Mohammed Salim', 'Adepu Preetham', 'Varna Jayadev', 'Aaditya N', 'Kartik Lakhotia', 'Dheeksha U', 'Samiksha Sunil'],
  stall15: ['Chundupalli Venkata Mayookha', 'Kanishka Garg', 'Aryan Chhabra', 'Malay Shukla', 'Nune Teja', 'Aman Ali', 'Aurobindo Dhar', 'Vihaan Dubey', 'Kritika Das', 'J Pranetaa', 'Rahul', 'Hitesh Ananth'],
  stall16: ['Aarya Deulkar', 'Pranavi Prasamsa Nomula', 'Ayush Kumar', 'Akshat Bhatia', 'Vignesh Giri R', 'Riya Gupta', 'Raunak Arora', 'Tanav Raghavendra S', 'Aryaman Jha', 'Adiraju Likhita'],
  stall17: ['Rishiraj Guha', 'Shreyash Varun', 'Jubair Ahmed Barbhuiya', 'Aanya Vikram Kapnadak', 'Nidhi Agrawal', 'Vedant Poddar', 'Bhumika Datta', 'Purnalakshmi Chatterjee', 'Sivasankar R', 'Darshan Chalapathi'],
  stall18: ['Jeremiah San Mathew', 'Saumya Daga', 'Shubham Shrivastava', 'Tanushree Tiwari', 'Paarthiv Banerjee', 'Sakina Meman', 'Devananda Prakash', 'Krishna Mittal', 'Mohit Vedukumar', 'Pranav R'],
  stall19: ['Nanditha Puthanveetil Ramesh', 'Shreya Sunder Babu', 'Aadi Sharma', 'Kanumuri Neehal Jaswanth Sai', 'Jaiveer Reddy Settipalli', 'Akshayaa T', 'Vanya Chawla', 'Gaurav Girish', 'Kartikeya Singh', 'Shuvam Singh', 'Laavanya Chaudhary', 'Palak Saini'],
  stall20: ['Daksh S Agarwal', 'Shatakshi Patel', 'Navami S J', 'Uttam V Bhonsle', 'Kapaganti Sai Santhosh', 'Aryan Prabodh Saxena', 'Tarana Dechakka K N', 'Ashini Sheoran', 'Raghav Kaushik', 'Sarthak Suresh'],
  stall21: ['Vidush Srivastava', 'Varsha Kachpuram', 'Anvita Mallu', 'B S V Revanth', 'Aarav Kamble', 'Sabyasachi Chakraborty', 'Nimisha Alias', 'Vasisht Chandrasekar', 'Pranav Srikanth', 'Janani Hariharaputhiran'],
  stall22: ['Shobitha Madiraju', 'Premraj M', 'Cris John Blesson', 'Aryan Raj', 'Nalysha', 'Adarsh Khatri', 'Ishita Chachan', 'Aryan'],
  stall23: ['Pareetri Dhwanee Buch', 'Manvi Chowdhury', 'Bhumit Singh Tanwar', 'Rishabh Rahul', 'Tejas', 'Adhvik Chand', 'Bhushith M', 'Prerana Pandian Mudaliar', 'Disha Raghav', 'Ved Sinai Bhatkuly'],
  stall24: ['Anushka Das', 'Vaishnavi Mishra', 'Yuvraj Singh Bhargava', 'Abhijith Raj', 'Trinabha Saha', 'Sehaj Mittal', 'Naina Ashmi Ahamed', 'Navoneel Mitra', 'Suryansh Singh', 'Muhammed Raees'],
  stall25: ['Mathew Joshua', 'Jahnavi Thakur', 'Neha Sidharthan', 'Akshay K M', 'Sanskriti Singh', 'Anshika Chandra', 'Lalit Yadav', 'Vb Saagarika', 'Ayan Ahmad Khan', 'Katam Rishith Yadav', 'Vennela Alluri'],
  stall26: ['Mihi Mathur', 'Mrudweeka Medabayani', 'Tithi Shripad', 'Divyansh Gupta', 'S Sagar', 'Shaivi Shankar', 'Krishna Agrawal', 'Bhavya Nagpal', 'Rohit Saju'],
  stall27: ['Karthika Lehan', 'Naman Pandya', 'Navya Joshi', 'Yashasvi Seth', 'Utkarsh Rai', 'Aryan Sethi', 'Annanya Gupta', 'Prakhar Chandra', 'Disha Mishra', 'Abhinava Majumder'],
  stall28: ['Aniket Sharma', 'Apoorva Raj Singh', 'Arnav Anand', 'Advait Sumesh', 'Shubham Yadav', 'Dhriti Madan', 'Jayant Jahaan', 'Shubhi Gupta', 'Kaustubh Kumar', 'Savni Pratap'],
  stall29: ['Tanusha Singh', 'Kushagra Sharma', 'Vrishabh Nair', 'Pavani Deshpande', 'Visva Varthan V S', 'Jemil', 'Swetha Gayathri S Iyer', 'Krish Varma', 'Shivangi Mittal', 'Charuhaas Abhay Mogalluru', 'Manas Arya'],
}

async function run() {
  // First, fetch all users to get their IDs
  const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  const { users } = await usersRes.json()

  let ok = 0, fail = 0

  for (const [stall, members] of Object.entries(TEAM_DATA)) {
    const email = `${stall}@fest.com`
    const user = users.find(u => u.email === email)
    if (!user) {
      console.log(`⚠️  User not found: ${email}`)
      fail++
      continue
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ team_members: members }),
    })

    if (res.ok) {
      console.log(`✅ ${stall}: ${members.length} members set`)
      ok++
    } else {
      const err = await res.text()
      console.log(`❌ ${stall}: ${err}`)
      fail++
    }
  }

  console.log(`\nDone: ${ok} updated, ${fail} failed`)
}

run().catch(console.error)
