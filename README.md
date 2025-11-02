# Vesting Problem
Technical assignment design to solve the problem os stock vesting for companies granting stock rewards to employees.

When a company grants an equity award (shares) to an employee, it usually has to vest before you can do anything with it. This vesting usually occurs in increments over a period of time, encouraging recipients to stay longer at the company. 

A vesting schedule defines how much total equity has been vested over a time. In this exercise, I will generate a cumulative vesting schedule from a series of individual vesting events.

# Build Instructions

## Pre-Requisites
- Have Node.js v22.18.0 or later installed.

## Build Step by Step
- Open your prefered terminal and run the following commands:
     - npm install
     - npx ts-node index.ts <file_name> <target_date>

## How to run the tests
- Run the command:
    - npx jest tests/.

## Vesting Schedule data File

This program expects a CSV file with the history of vesting events. The file should follow the convention:

<<VESTING_EVENT>>,<<EMPLOYEE ID>>,<<EMPLOYEE NAME>>,<<AWARD ID>>,<<DATE>>,<<QUANTITY>>

A few observations about the properties:
- VESTING_EVENT: Should have the value VEST for vesting events or CANCEL for cancellation events.
- DATE: Should follow the format YYYY-MM-DD
- Quantity: Should be an integer number

Here's an example:

VEST,E001,Alice Smith,ISO-001,2020-01-01,1000
CANCEL,E001,Alice Smith,ISO-001,2021-02-01,700

# Key Design Decisions

- I decided to use a Hexagonal Architecture to isolate the core business logic (Domain) from the external connections.
    - The main external connections I designed for this solution are:
        - API Input - The entry point of the program that expects a set list of parameters to calculate the vested shares.
        - API Output - The output interface of the program that can send the process data to another service.
        - Vesting Event Repository - The interface responsible for providing the Vesting Events History data to be processed by the program.
    - As the actual implementation for those interfaces I created the following adapters:
        - Vesting Events Console Out (API Output) - Implements a console output for the consolidated vested shares data.
        - Vesting Events File Respository (Vesting Event Repository) - Provides the Vesting Events data reading from a CSV file.
    - The main benefit for this solution is being flexible to extend / change the outter connection without affecting the core logic:
        - If instead of just printing the output in the console we decided to also send it to a messaging broker to be process by another service, all we would have to do is implement another adapter implementing the API Output interface.
        - If instead of reading the Vesting Events data from a file we would like to retrieve it from a database, all we had to do is to create another adapter for the Vesting Event Repository interface retrieving the data from a Database.

- I assumed the listing of possible Award Ids is not known prior to processing the file, which requires to read the entire data set at least once to know all the possible combinations of Employee Id + Award Id. If the list was fixed this could be avoided, enhancing the processing time.

- I decided to leave most of the logic in the Repository because it was the most efficient way I found to process the file avoiding going through the data multiple times. This solution kind of replicates the case when most of the processing is done by the database.
    - I would do it differently in the case where every line of the file was considered a separate transaction on the API, which is not what the problem lists. In this case the Repository would be only responsible for the data read and I would move most of the logic to the Service.

- For the different types of Vesting Event I decided to use a Strategy like design pattern, defining processor classes for each operation. That leaves the rest of the code independent to the supported operations and make it way easier to implement new ones.


# Scalability and Performance
- I implemented this solution consireding the scenerio where the input file might be very big. In order to optimize the data processing for larger amounts of data I decided to read the VestedShares data as a BST(Binary Search Tree) instead of a regular Array. That ensures O(log n) inserts and reads while keeping the data alredy sorted for further display. This optimization could be completely replaced by Indexing if we were using a traditional Database, as most databases use variations of B-Trees.
    - In the other hand we would consider a scenario where we would get a lot of request to process smaller files, I would go in a different direction. One possibility would be to scale the application horizontally with multiple workers and a load balancer, maybe even using a serverless option like AWS Lambda.
    - To accomplish the requirement the Stage 2 requirement to invalid any cancelation events that exceeds the amount of shares vested on or before the target date I indexed the primary BST used to read the CSV file by Date and EVENT. That ensures that on a given date the VEST events would be processed prior to the CANCEL events, avoiding to invalidate a CANCEL event that should otherwise be processed.
- In order to optimize the VestedShares computing process I created a very basic cache structure using a Map by the key Employee Id + Award Id (required for the ouput). In a production environment with a bigger dataset this should be replaced by a more robust option like Reddis.
