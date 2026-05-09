-- 1. Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id                 text PRIMARY KEY,
  tier               text NOT NULL,
  topic              text NOT NULL,
  type               text NOT NULL,
  question           text NOT NULL,
  answer             text NOT NULL,
  alternative_answer text,
  explanation        text NOT NULL,
  created_at         timestamptz DEFAULT now()
);

-- 2. View (no answer columns)
CREATE OR REPLACE VIEW public_questions AS
  SELECT id, tier, topic, type, question, explanation, created_at
  FROM questions;

-- 3. check_answer function
CREATE OR REPLACE FUNCTION check_answer(question_id text, user_answer text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS
$$
DECLARE
  correct_answer  text;
  correct_alt     text;
  normalized_user text;
BEGIN
  SELECT answer, alternative_answer
  INTO correct_answer, correct_alt
  FROM questions
  WHERE id = question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found: %', question_id;
  END IF;

  normalized_user := lower(trim(user_answer));
  correct_answer  := lower(trim(correct_answer));
  correct_alt     := lower(trim(coalesce(correct_alt, '')));

  RETURN normalized_user = correct_answer
      OR (correct_alt <> '' AND normalized_user = correct_alt);
END;
$$;

-- 4. Enable RLS — no direct anon access to the questions table (answers are in it)
--    Unauthenticated clients must use public_questions view via the API.
--    check_answer() is SECURITY DEFINER so it bypasses RLS internally.
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'questions' AND policyname = 'anon_read'
  ) THEN
    EXECUTE 'DROP POLICY anon_read ON questions';
  END IF;
END;
$do$;

-- 5. Seed questions
INSERT INTO questions (id, tier, topic, type, question, answer, alternative_answer, explanation)
VALUES
  ($q$S001$q$, $q$simple$q$, $q$variables$q$, $q$write_the_code$q$, $q$Write code that stores the integer 7 in a variable called lucky_number and prints it.$q$, $q$lucky_number = 7
print(lucky_number)$q$, NULL, $q$Variables are created with the = assignment operator. Writing lucky_number = 7 stores the integer 7. Calling print(lucky_number) then outputs the stored value, which is 7.$q$),
  ($q$S002$q$, $q$simple$q$, $q$strings$q$, $q$write_the_code$q$, $q$Write code that stores the string "Python" in a variable called language and prints it in all uppercase letters.$q$, $q$language = "Python"
print(language.upper())$q$, NULL, $q$Strings are stored by assigning text in quotes to a variable. The .upper() method returns a new string with every character converted to uppercase, so language.upper() produces "PYTHON".$q$),
  ($q$S003$q$, $q$simple$q$, $q$type_conversion$q$, $q$write_the_code$q$, $q$Write code that converts the string "50" to an integer, adds 10 to it, and prints the result.$q$, $q$result = int("50") + 10
print(result)$q$, $q$n = int("50")
n += 10
print(n)$q$, $q$int() converts a string containing a whole number into an integer you can do arithmetic on. Without this conversion, adding 10 to "50" would raise a TypeError. int("50") gives 50, and 50 + 10 = 60.$q$),
  ($q$S004$q$, $q$simple$q$, $q$operators$q$, $q$write_the_code$q$, $q$Write code that calculates and prints the remainder when 23 is divided by 4.$q$, $q$print(23 % 4)$q$, $q$remainder = 23 % 4
print(remainder)$q$, $q$The % operator (modulo) returns the remainder after integer division. 23 divided by 4 gives 5 with a remainder of 3 (because 4 × 5 = 20, and 23 − 20 = 3), so 23 % 4 evaluates to 3.$q$),
  ($q$S005$q$, $q$simple$q$, $q$conditionals$q$, $q$write_the_code$q$, $q$Write code that stores 15 in a variable called age. If age is greater than or equal to 18, print "adult". Otherwise, print "minor".$q$, $q$age = 15
if age >= 18:
    print("adult")
else:
    print("minor")$q$, NULL, $q$An if/else statement runs one of two blocks based on a condition. Since 15 is not >= 18, the if condition is False, so the else block runs and "minor" is printed.$q$),
  ($q$S006$q$, $q$simple$q$, $q$loops$q$, $q$write_the_code$q$, $q$Write code that uses a for loop and range() to print the even numbers from 2 to 8, one per line.$q$, $q$for i in range(2, 9, 2):
    print(i)$q$, $q$for i in range(1, 9):
    if i % 2 == 0:
        print(i)$q$, $q$range(start, stop, step) generates numbers from start up to (but not including) stop, incrementing by step each time. range(2, 9, 2) produces 2, 4, 6, 8. The for loop prints each value on its own line.$q$),
  ($q$S007$q$, $q$simple$q$, $q$lists$q$, $q$write_the_code$q$, $q$Write code that creates a list called planets containing "Mercury", "Venus", and "Earth". Print the last item in the list.$q$, $q$planets = ["Mercury", "Venus", "Earth"]
print(planets[-1])$q$, $q$planets = ["Mercury", "Venus", "Earth"]
print(planets[2])$q$, $q$Lists store multiple items in order. To access the last element you can use index -1, which always refers to the final item regardless of list length. planets[-1] returns "Earth".$q$),
  ($q$S008$q$, $q$simple$q$, $q$strings$q$, $q$write_the_code$q$, $q$Write code that stores the string "  hello  " in a variable and prints it with all leading and trailing spaces removed.$q$, $q$text = "  hello  "
print(text.strip())$q$, NULL, $q$The .strip() method removes all leading and trailing whitespace from a string and returns a new string. Calling .strip() on "  hello  " produces "hello".$q$),
  ($q$S009$q$, $q$simple$q$, $q$loops$q$, $q$write_the_code$q$, $q$Write code that uses a while loop to count down from 3 to 1, printing each number, then prints "Go!" after the loop ends.$q$, $q$count = 3
while count >= 1:
    print(count)
    count -= 1
print("Go!")$q$, NULL, $q$A while loop runs as long as its condition is True. Starting count at 3 and subtracting 1 each iteration, the loop prints 3, 2, 1 before count reaches 0 and the condition becomes False. print("Go!") runs once after the loop exits.$q$),
  ($q$S010$q$, $q$simple$q$, $q$builtins$q$, $q$write_the_code$q$, $q$Write code that creates the list [4, 7, 2, 9, 1] and prints the smallest number first, then the largest number on the next line.$q$, $q$nums = [4, 7, 2, 9, 1]
print(min(nums))
print(max(nums))$q$, NULL, $q$The built-in min() function returns the smallest value in an iterable, and max() returns the largest. min([4, 7, 2, 9, 1]) is 1 and max([4, 7, 2, 9, 1]) is 9. Each print() call outputs on its own line.$q$),
  ($q$S011$q$, $q$simple$q$, $q$tuples$q$, $q$write_the_code$q$, $q$Write code that creates a tuple called colors containing "red", "green", and "blue". Print the length of the tuple.$q$, $q$colors = ("red", "green", "blue")
print(len(colors))$q$, NULL, $q$Tuples are created by separating values with commas, usually wrapped in parentheses: colors = ("red", "green", "blue"). Like lists, tuples work with len(), which returns the number of elements. len(colors) returns 3.$q$),
  ($q$S012$q$, $q$simple$q$, $q$lists$q$, $q$write_the_code$q$, $q$Write code that creates an empty list called bag, appends "book" to it, then appends "pen", then prints the list.$q$, $q$bag = []
bag.append("book")
bag.append("pen")
print(bag)$q$, NULL, $q$An empty list is created with []. The .append() method adds a single item to the end of the list in place. After two appends, bag contains both items, and printing the list outputs it in standard list format: ['book', 'pen'].$q$),
  ($q$S013$q$, $q$simple$q$, $q$variables$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints 7.

counter = 10
counter = counter - 3
print(___)$q$, $q$counter$q$, NULL, $q$The variable counter is reassigned to 10 - 3 = 7. To print this updated value, you pass the variable name counter (without quotes) to print(). Passing the string "counter" in quotes would print the text counter, not the number 7.$q$),
  ($q$S014$q$, $q$simple$q$, $q$strings$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints: hello world

sentence = "Hello World"
print(sentence.___())$q$, $q$lower$q$, NULL, $q$The .lower() method returns a copy of the string with all characters converted to lowercase. Calling sentence.lower() on "Hello World" produces "hello world". The original variable is unchanged.$q$),
  ($q$S015$q$, $q$simple$q$, $q$operators$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints 81.

base = 3
result = base ___ 4
print(result)$q$, $q$**$q$, NULL, $q$The ** operator raises the left number to the power of the right number. 3 ** 4 means 3 × 3 × 3 × 3 = 81. Using * would give 3 × 4 = 12, which is multiplication, not exponentiation.$q$),
  ($q$S016$q$, $q$simple$q$, $q$conditionals$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints "no points".

points = 0
if points ___ 0:
    print("no points")
else:
    print("has points")$q$, $q$==$q$, NULL, $q$The == operator checks whether two values are equal. Since points is 0, the condition points == 0 is True, so the if block runs. Using = instead of == would cause a SyntaxError — a single = is for assignment, not comparison.$q$),
  ($q$S017$q$, $q$simple$q$, $q$loops$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the loop prints 1, 2, 3, and 4 on separate lines.

for i in range(1, ___):
    print(i)$q$, $q$5$q$, NULL, $q$range(start, stop) generates integers from start up to but not including stop. To produce 1, 2, 3, 4, you need range(1, 5) — the stop value 5 itself is excluded. Using range(1, 4) would only print 1, 2, 3.$q$),
  ($q$S018$q$, $q$simple$q$, $q$lists$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints "rabbit".

animals = ["cat", "dog", "rabbit"]
print(animals[___])$q$, $q$2$q$, $q$-1$q$, $q$List indexing starts at 0, so "cat" is at index 0, "dog" at index 1, and "rabbit" at index 2. You can also use index -1, which always refers to the last element in any list.$q$),
  ($q$S019$q$, $q$simple$q$, $q$type_conversion$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints 196.

temperature = "98"
temp_int = ___(temperature)
print(temp_int * 2)$q$, $q$int$q$, NULL, $q$int() converts a string that contains a whole number into an actual integer. Without the conversion, multiplying a string by 2 would repeat it ("9898") rather than doing arithmetic. After int("98") = 98, and 98 * 2 = 196.$q$),
  ($q$S020$q$, $q$simple$q$, $q$strings$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the code prints: Hello, World!

place = "World"
print(f"Hello, ___!")$q$, $q${place}$q$, NULL, $q$Inside an f-string (a string prefixed with f), any expression in curly braces {} is evaluated and inserted into the string. Writing {place} tells Python to replace it with the value of the variable place, producing "Hello, World!".$q$),
  ($q$S021$q$, $q$simple$q$, $q$variables$q$, $q$output_prediction$q$, $q$What will the following code print?

val = 10
val = val * 2
val = val - 5
print(val)$q$, $q$15$q$, NULL, $q$Python runs assignments from top to bottom. val starts at 10, then becomes 10 * 2 = 20, then becomes 20 - 5 = 15. Each assignment overwrites the previous value of val.$q$),
  ($q$S022$q$, $q$simple$q$, $q$operators$q$, $q$output_prediction$q$, $q$What will the following code print?

a = 9
b = 4
print(a // b)
print(a % b)$q$, $q$2
1$q$, NULL, $q$// is floor division — it divides and rounds down to the nearest integer (9 // 4 = 2). % is the modulo operator — it gives the remainder (9 % 4 = 1, because 4 × 2 = 8 and 9 − 8 = 1). Each print() outputs on its own line.$q$),
  ($q$S023$q$, $q$simple$q$, $q$strings$q$, $q$output_prediction$q$, $q$What will the following code print?

word = "orange"
print(word[1])
print(word[-2])$q$, $q$r
g$q$, NULL, $q$word[1] accesses the character at index 1, which is 'r' (o=0, r=1). word[-2] counts from the end: index -1 is 'e', so -2 is 'g'. Each print() outputs one character on its own line.$q$),
  ($q$S024$q$, $q$simple$q$, $q$conditionals$q$, $q$output_prediction$q$, $q$What will the following code print?

num = 0
if num:
    print("truthy")
else:
    print("falsy")$q$, $q$falsy$q$, NULL, $q$In Python, 0 is considered falsy — it behaves like False when used as a condition. The if block requires a truthy value to run, so since num is 0, the else block runs and "falsy" is printed.$q$),
  ($q$S025$q$, $q$simple$q$, $q$loops$q$, $q$output_prediction$q$, $q$What will the following code print?

result = 1
for i in range(1, 4):
    result = result * i
print(result)$q$, $q$6$q$, NULL, $q$range(1, 4) generates 1, 2, 3. The loop multiplies result by each value in turn: 1 * 1 = 1, 1 * 2 = 2, 2 * 3 = 6. After the loop finishes, print(result) outputs 6.$q$),
  ($q$S026$q$, $q$simple$q$, $q$lists$q$, $q$output_prediction$q$, $q$What will the following code print?

nums = [5, 3, 8, 1, 9, 2]
print(sorted(nums))$q$, $q$[1, 2, 3, 5, 8, 9]$q$, NULL, $q$sorted() returns a new list with the elements arranged in ascending order (smallest to largest by default). It does not modify the original list. The output is the sorted version of [5, 3, 8, 1, 9, 2].$q$),
  ($q$S027$q$, $q$simple$q$, $q$builtins$q$, $q$output_prediction$q$, $q$What will the following code print?

words = ["banana", "apple", "cherry"]
print(sorted(words))$q$, $q$['apple', 'banana', 'cherry']$q$, NULL, $q$sorted() works on lists of strings too, sorting them alphabetically in ascending order. "apple" comes before "banana", which comes before "cherry". The result is a new sorted list; the original words list is unchanged.$q$),
  ($q$S028$q$, $q$simple$q$, $q$variables$q$, $q$what_is_the_result$q$, $q$What is the result of the following expression?

type(3.14)$q$, $q$<class 'float'>$q$, NULL, $q$3.14 is a floating-point number (a number with a decimal point). Python's type() function returns its type as <class 'float'>. This is different from int (whole numbers) or str (text).$q$),
  ($q$S029$q$, $q$simple$q$, $q$tuples$q$, $q$what_is_the_result$q$, $q$What is the result of the following expression?

coords = (10, 20, 30)
coords[1]$q$, $q$20$q$, NULL, $q$Tuples support indexing just like lists, starting at 0. Index 0 is 10, index 1 is 20, and index 2 is 30. coords[1] returns the element at index 1, which is 20.$q$),
  ($q$S030$q$, $q$simple$q$, $q$loops$q$, $q$spot_the_bug$q$, $q$The following code is supposed to print 1, 2, 3, 4 but instead runs forever. Identify the bug and describe the fix.

count = 1
while count < 5:
    print(count)
count += 1$q$, $q$count += 1 is outside the while loop. Fix: indent it by 4 spaces so it runs inside the loop body.$q$, NULL, $q$Because count += 1 is not indented under the while block, it never executes during the loop. count stays at 1 forever, the condition count < 5 is always True, and the loop never ends. Moving count += 1 inside the loop ensures count grows each iteration until it reaches 5.$q$),
  ($q$I001$q$, $q$intermediate$q$, $q$list_comprehension$q$, $q$write_the_code$q$, $q$Write a list comprehension that creates a list of squares of all even numbers from 1 to 10. Print the result.$q$, $q$result = [x**2 for x in range(1, 11) if x % 2 == 0]
print(result)$q$, $q$result = [x**2 for x in range(2, 11, 2)]
print(result)$q$, $q$A list comprehension [expr for var in iterable if condition] builds a list in one line. range(1, 11) gives numbers 1 through 10. The condition x % 2 == 0 keeps only even numbers, and x**2 squares each one.$q$),
  ($q$I002$q$, $q$intermediate$q$, $q$dict_comprehension$q$, $q$write_the_code$q$, $q$Write a dict comprehension that maps each word in ["cat", "dog", "elephant"] to its length. Print the result.$q$, $q$words = ["cat", "dog", "elephant"]
result = {word: len(word) for word in words}
print(result)$q$, NULL, $q$A dict comprehension {key_expr: value_expr for var in iterable} builds a dictionary in one line. Here len(word) computes the length of each string, so each word becomes the key and its character count becomes the value.$q$),
  ($q$I003$q$, $q$intermediate$q$, $q$set_comprehension$q$, $q$write_the_code$q$, $q$Write a set comprehension that contains the first letter of each word in ["apple", "banana", "avocado", "blueberry"]. Print the result.$q$, $q$words = ["apple", "banana", "avocado", "blueberry"]
result = {word[0] for word in words}
print(result)$q$, NULL, $q$A set comprehension {expr for var in iterable} builds a set, which automatically removes duplicates. word[0] gets the first character of each word. Since multiple words share the same first letter, the result is the set {'a', 'b'}.$q$),
  ($q$I004$q$, $q$intermediate$q$, $q$functions_default_args$q$, $q$write_the_code$q$, $q$Write a function greet(name, greeting="Hello") that prints the greeting and name in the format "Hello, Alice!". Call it as greet("Alice") then greet("Bob", "Hi").$q$, $q$def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

greet("Alice")
greet("Bob", "Hi")$q$, NULL, $q$Default arguments give a parameter a fallback value used when the caller does not supply one. When greet("Alice") is called, greeting stays "Hello". When greet("Bob", "Hi") is called, greeting is overridden to "Hi".$q$),
  ($q$I005$q$, $q$intermediate$q$, $q$args$q$, $q$write_the_code$q$, $q$Write a function total(*numbers) that returns the sum of any number of positional arguments. Print total(1, 2, 3, 4).$q$, $q$def total(*numbers):
    return sum(numbers)

print(total(1, 2, 3, 4))$q$, NULL, $q$The *args syntax collects all extra positional arguments into a tuple. Inside the function, numbers is that tuple, so sum(numbers) adds them all. This lets callers pass any number of values without defining fixed parameters.$q$),
  ($q$I006$q$, $q$intermediate$q$, $q$kwargs$q$, $q$write_the_code$q$, $q$Write a function display(**info) that prints each key and value on its own line in the format "name: Alice". Call it with name="Alice", age=30.$q$, $q$def display(**info):
    for key, value in info.items():
        print(f"{key}: {value}")

display(name="Alice", age=30)$q$, NULL, $q$The **kwargs syntax collects all extra keyword arguments into a dictionary. Iterating over info.items() gives (key, value) pairs, which you can print with an f-string or .format(). The caller uses keyword syntax to pass named values.$q$),
  ($q$I007$q$, $q$intermediate$q$, $q$scope$q$, $q$write_the_code$q$, $q$Write a function make_counter() that defines an inner function increment() which adds 1 to a nonlocal variable count each time it is called. Return increment. Call the returned function 3 times and print the count after the third call.$q$, $q$def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

counter = make_counter()
counter()
counter()
print(counter())$q$, NULL, $q$nonlocal lets an inner function read and modify a variable from its enclosing scope without making it global. Each call to increment() adds 1 to the count variable that lives in make_counter's frame, so after 3 calls count is 3.$q$),
  ($q$I008$q$, $q$intermediate$q$, $q$lambda$q$, $q$write_the_code$q$, $q$Write a lambda expression that takes two numbers and returns the larger one. Store it in a variable called bigger and print bigger(5, 9).$q$, $q$bigger = lambda a, b: a if a > b else b
print(bigger(5, 9))$q$, NULL, $q$A lambda is an anonymous one-expression function. The conditional expression a if a > b else b evaluates and returns whichever of the two arguments is greater. For bigger(5, 9), 9 > 5 is False so the else branch returns 9.$q$),
  ($q$I009$q$, $q$intermediate$q$, $q$string_methods$q$, $q$write_the_code$q$, $q$Given sentence = "the quick brown fox", write code that splits it into words, capitalizes the first letter of each word, joins them back with a single space, and prints the result.$q$, $q$sentence = "the quick brown fox"
words = sentence.split()
print(" ".join(word.capitalize() for word in words))$q$, $q$sentence = "the quick brown fox"
print(" ".join(w.capitalize() for w in sentence.split()))$q$, $q$str.split() breaks a string on whitespace into a list of words. str.capitalize() uppercases the first character and lowercases the rest. " ".join(words) reassembles the list into a single string with spaces between items.$q$),
  ($q$I010$q$, $q$intermediate$q$, $q$dict_crud$q$, $q$write_the_code$q$, $q$Write code that creates a dictionary scores = {"Alice": 90, "Bob": 78}, adds "Carol" with a score of 95, updates Bob's score to 85, removes Alice, then prints the final dictionary.$q$, $q$scores = {"Alice": 90, "Bob": 78}
scores["Carol"] = 95
scores["Bob"] = 85
del scores["Alice"]
print(scores)$q$, NULL, $q$Dictionaries support direct key assignment for both adding and updating. scores["Carol"] = 95 adds a new key. scores["Bob"] = 85 updates an existing one. del scores["Alice"] removes the key-value pair entirely.$q$),
  ($q$I011$q$, $q$intermediate$q$, $q$dict_iteration$q$, $q$write_the_code$q$, $q$Write code that iterates over the dictionary {"a": 1, "b": 2, "c": 3} and prints each key-value pair in the format "a -> 1".$q$, $q$d = {"a": 1, "b": 2, "c": 3}
for k, v in d.items():
    print(f"{k} -> {v}")$q$, NULL, $q$dict.items() returns each key-value pair as a tuple. Unpacking it with for k, v in d.items() lets you use both the key and value directly in the loop body, making it easy to format each pair.$q$),
  ($q$I012$q$, $q$intermediate$q$, $q$set_operations$q$, $q$write_the_code$q$, $q$Write code that creates two sets A = {1, 2, 3, 4} and B = {3, 4, 5, 6}. Print their union, intersection, and difference A - B on separate lines.$q$, $q$A = {1, 2, 3, 4}
B = {3, 4, 5, 6}
print(A | B)
print(A & B)
print(A - B)$q$, $q$A = {1, 2, 3, 4}
B = {3, 4, 5, 6}
print(A.union(B))
print(A.intersection(B))
print(A.difference(B))$q$, $q$Set operators mirror mathematical set theory. | (or .union()) combines both sets. & (or .intersection()) returns only shared elements. - (or .difference()) returns elements in A that are not in B.$q$),
  ($q$I013$q$, $q$intermediate$q$, $q$nested_loops$q$, $q$write_the_code$q$, $q$Write nested loops that print a 3x3 multiplication table. Each line should follow the format "1 x 1 = 1". Use an outer loop for rows (1 to 3) and an inner loop for columns (1 to 3).$q$, $q$for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i * j}")$q$, NULL, $q$Nesting a for loop inside another lets you visit every combination of two ranges. The outer loop controls the row number and the inner loop controls the column, so the body executes 3 x 3 = 9 times total.$q$),
  ($q$I014$q$, $q$intermediate$q$, $q$list_comprehension$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank to keep only even numbers:
evens = [x for x in range(20) if ___]$q$, $q$x % 2 == 0$q$, $q$x % 2 != 1$q$, $q$The if clause in a list comprehension acts as a filter. x % 2 == 0 uses the modulo operator to check whether x divides evenly by 2, which is true for every even number.$q$),
  ($q$I015$q$, $q$intermediate$q$, $q$dict_comprehension$q$, $q$fill_in_the_blank$q$, $q$Fill in the missing keyword to invert a dictionary (swap keys and values):
inv = {v: k for k, v ___ d.items()}$q$, $q$in$q$, NULL, $q$The for clause in a comprehension uses the keyword in to iterate over an iterable. d.items() yields (key, value) tuples, and the unpacking k, v separates them so you can swap their roles in the output.$q$),
  ($q$I016$q$, $q$intermediate$q$, $q$functions_default_args$q$, $q$fill_in_the_blank$q$, $q$Fill in the default value so that power(3) returns 9:
def power(base, exp=___): return base ** exp$q$, $q$2$q$, NULL, $q$A default argument is written as parameter=value in the function signature. With exp=2, calling power(3) computes 3 ** 2 which equals 9. The caller can still override it, e.g. power(3, 3) returns 27.$q$),
  ($q$I017$q$, $q$intermediate$q$, $q$args$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the function returns the sum of all positional arguments:
def total(*nums): return ___(nums)$q$, $q$sum$q$, NULL, $q$*nums collects all positional arguments into a tuple called nums. The built-in sum() then adds every element of that tuple together and returns the total.$q$),
  ($q$I018$q$, $q$intermediate$q$, $q$lambda$q$, $q$fill_in_the_blank$q$, $q$Fill in the expression so this lambda doubles its input:
double = lambda x: ___$q$, $q$x * 2$q$, $q$x + x$q$, $q$A lambda body is a single expression whose value is automatically returned. x * 2 multiplies the argument by 2, so double(5) returns 10.$q$),
  ($q$I019$q$, $q$intermediate$q$, $q$string_methods$q$, $q$fill_in_the_blank$q$, $q$Fill in the method name that splits a string on ", ":
words = sentence.___(', ')$q$, $q$split$q$, NULL, $q$str.split(sep) breaks a string into a list of substrings at every occurrence of sep. "a, b, c".split(", ") produces ["a", "b", "c"].$q$),
  ($q$I020$q$, $q$intermediate$q$, $q$string_methods$q$, $q$fill_in_the_blank$q$, $q$Fill in the method name that inserts "World" into the placeholder:
msg = "Hello, {}!".___('World')$q$, $q$format$q$, NULL, $q$str.format() replaces each {} placeholder in the string with the corresponding argument in order. "Hello, {}!".format("World") produces "Hello, World!".$q$),
  ($q$I021$q$, $q$intermediate$q$, $q$dict_iteration$q$, $q$fill_in_the_blank$q$, $q$Fill in the method name that returns all keys of a dictionary as a view object:
for key in d.___():$q$, $q$keys$q$, NULL, $q$dict.keys() returns a live view of all keys in the dictionary. Iterating over it visits every key without creating an extra list, and the view stays in sync if the dictionary changes.$q$),
  ($q$I022$q$, $q$intermediate$q$, $q$set_operations$q$, $q$fill_in_the_blank$q$, $q$Fill in the operator that gives the intersection of two sets:
common = A ___ B$q$, $q$&$q$, $q$.intersection()$q$, $q$The & operator computes the intersection of two sets — the elements that appear in both. It is equivalent to A.intersection(B). For example, {1,2,3} & {2,3,4} gives {2, 3}.$q$),
  ($q$I023$q$, $q$intermediate$q$, $q$scope$q$, $q$fill_in_the_blank$q$, $q$Fill in the keyword so the inner function can modify the outer variable count:
def outer():
    count = 0
    def inner():
        ___ count
        count += 1$q$, $q$nonlocal$q$, NULL, $q$Without nonlocal, assigning to count inside inner() creates a new local variable, leaving the outer count unchanged. The nonlocal keyword tells Python to look up the enclosing scope for that name instead of creating a new binding.$q$),
  ($q$I024$q$, $q$intermediate$q$, $q$list_comprehension$q$, $q$output_prediction$q$, $q$What does this code print?
print([x**2 for x in range(5)])$q$, $q$[0, 1, 4, 9, 16]$q$, NULL, $q$range(5) yields 0, 1, 2, 3, 4. The comprehension squares each value: 0²=0, 1²=1, 2²=4, 3²=9, 4²=16. The result is a list, so Python prints it with square brackets and commas.$q$),
  ($q$I025$q$, $q$intermediate$q$, $q$dict_crud$q$, $q$output_prediction$q$, $q$What does this code print?
d = {'x': 10, 'y': 20}
d['x'] += 5
print(d['x'])$q$, $q$15$q$, NULL, $q$d["x"] += 5 is shorthand for d["x"] = d["x"] + 5. It reads the current value (10), adds 5, and stores 15 back under the same key. print(d["x"]) then outputs that updated value.$q$),
  ($q$I026$q$, $q$intermediate$q$, $q$set_operations$q$, $q$output_prediction$q$, $q$What does this code print?
s = {1, 2, 2, 3, 3, 3}
print(len(s))$q$, $q$3$q$, NULL, $q$A set stores only unique elements. Duplicate values 2 and 3 are automatically discarded when the set is created, leaving {1, 2, 3}. len() then counts those three distinct elements.$q$),
  ($q$I027$q$, $q$intermediate$q$, $q$lambda$q$, $q$output_prediction$q$, $q$What does this code print?
f = lambda a, b: a if a > b else b
print(f(4, 7))$q$, $q$7$q$, NULL, $q$The lambda returns whichever argument is greater using a conditional expression. With a=4 and b=7, the condition 4 > 7 is False, so the expression evaluates to b, which is 7.$q$),
  ($q$I028$q$, $q$intermediate$q$, $q$string_methods$q$, $q$output_prediction$q$, $q$What does this code print?
print('hello world'.split()[1].upper())$q$, $q$WORLD$q$, NULL, $q$.split() with no argument splits on any whitespace, giving ["hello", "world"]. [1] picks the second element, "world". .upper() converts every character to uppercase, producing "WORLD".$q$),
  ($q$I029$q$, $q$intermediate$q$, $q$scope$q$, $q$output_prediction$q$, $q$What does this code print?
x = 5
def f():
    x = 10
f()
print(x)$q$, $q$5$q$, NULL, $q$Inside f(), x = 10 creates a new local variable that shadows the global x — it does not modify it. When the function returns its local scope is discarded. The global x is still 5, so that is what print(x) outputs.$q$),
  ($q$I030$q$, $q$intermediate$q$, $q$nested_loops$q$, $q$output_prediction$q$, $q$What does this code print?
total = 0
for i in range(3):
    for j in range(3):
        total += 1
print(total)$q$, $q$9$q$, NULL, $q$The outer loop runs 3 times and the inner loop runs 3 times for each outer iteration, so total += 1 executes 3 x 3 = 9 times. total starts at 0 and ends at 9.$q$),
  ($q$I031$q$, $q$intermediate$q$, $q$functions_default_args$q$, $q$spot_the_bug$q$, $q$What is the bug in this function? What does add(1) return the first time, and what does add(2) return the second time?
def add(a, b=[]):
    b.append(a)
    return b$q$, $q$First call returns [1], second call returns [1, 2]. The default list persists across calls because mutable default arguments are created once when the function is defined, not each time it is called.$q$, NULL, $q$Default argument values are evaluated once at function definition time. The same list object is reused every time b is not supplied by the caller. Fix this with b=None and then inside the function: if b is None: b = []. This creates a fresh list on every call.$q$),
  ($q$I032$q$, $q$intermediate$q$, $q$dict_crud$q$, $q$spot_the_bug$q$, $q$What error does this code raise, and how do you fix it?
scores = {'Alice': 90}
print(scores['Bob'])$q$, $q$KeyError: 'Bob'$q$, NULL, $q$Accessing a dictionary with a key that does not exist raises a KeyError. The safe alternatives are scores.get("Bob"), which returns None instead of raising, or scores.get("Bob", 0) to supply a default value, or checking first with if "Bob" in scores.$q$),
  ($q$I033$q$, $q$intermediate$q$, $q$set_operations$q$, $q$what_is_the_result$q$, $q$What does this code print?
a = {1, 2, 3}
b = a
b.add(4)
print(a)$q$, $q${1, 2, 3, 4}$q$, NULL, $q$Sets are mutable objects. b = a does not copy the set — both names point to the same object in memory. When b.add(4) mutates that object, the change is visible through a as well. To make an independent copy, use b = a.copy().$q$),
  ($q$I034$q$, $q$intermediate$q$, $q$list_comprehension$q$, $q$spot_the_bug$q$, $q$The goal is to remove all 2s from the list. What is wrong with this code, and what does it actually print?
nums = [1, 2, 2, 3]
for n in nums:
    if n == 2:
        nums.remove(n)
print(nums)$q$, $q$[1, 2, 3]$q$, NULL, $q$When the first 2 is removed, the list shifts left and the iterator's index advances past the second 2 without ever checking it. The safe fix is to iterate over a copy — for n in nums[:] — or use a list comprehension: nums = [n for n in nums if n != 2].$q$),
  ($q$I035$q$, $q$intermediate$q$, $q$dict_crud$q$, $q$what_is_the_result$q$, $q$What does this code print?
d = {}
d.setdefault('count', 0)
d['count'] += 1
d.setdefault('count', 99)
print(d['count'])$q$, $q$1$q$, NULL, $q$setdefault(key, default) only sets the value if the key is not already in the dictionary. The first call sets 'count' to 0. Then d['count'] += 1 makes it 1. The second setdefault call sees that 'count' already exists and does nothing, leaving the value as 1.$q$),
  ($q$H001$q$, $q$hard$q$, $q$decorators$q$, $q$write_the_code$q$, $q$Write a decorator called logger that prints "Calling <function name>" before a function runs and "Done" after. Apply it to a function add(a, b) that returns a + b. Call add(2, 3) and print its return value.$q$, $q$def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print("Done")
        return result
    return wrapper

@logger
def add(a, b):
    return a + b

print(add(2, 3))$q$, NULL, $q$A decorator is a function that takes another function as an argument and returns a new wrapper function that adds behavior before and/or after the original call. The wrapper uses *args and **kwargs so it can forward any arguments to the original. func.__name__ gives the original function's name string.$q$),
  ($q$H002$q$, $q$hard$q$, $q$generators$q$, $q$write_the_code$q$, $q$Write a generator function countdown(n) that yields integers from n down to 1. Iterate over countdown(5) and print each value on its own line.$q$, $q$def countdown(n):
    while n >= 1:
        yield n
        n -= 1

for num in countdown(5):
    print(num)$q$, NULL, $q$A generator function uses yield instead of return to produce a sequence of values one at a time. Each time next() is called (implicitly by a for loop), execution resumes right after the last yield. This makes generators memory-efficient because they produce values lazily instead of building a full list upfront.$q$),
  ($q$H003$q$, $q$hard$q$, $q$context_managers$q$, $q$write_the_code$q$, $q$Use @contextlib.contextmanager to write a context manager called tag(name) that prints "<name>" on enter and "</name>" on exit. Use it with a with block that prints "Hello" — where name is "div".$q$, $q$from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")

with tag("div"):
    print("Hello")$q$, NULL, $q$@contextlib.contextmanager converts a generator function into a context manager. Everything before yield runs as __enter__ logic, the yielded value (if any) is bound by as, and everything after yield runs as __exit__ logic. This is simpler than writing a full class with __enter__ and __exit__.$q$),
  ($q$H004$q$, $q$hard$q$, $q$error_handling$q$, $q$write_the_code$q$, $q$Write a function safe_divide(a, b) that tries to divide a by b. If b is zero, catch the ZeroDivisionError and return the string "Cannot divide by zero". Use a finally block to always print "Operation complete". Call safe_divide(10, 0) and print its return value.$q$, $q$def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Cannot divide by zero"
    finally:
        print("Operation complete")

print(safe_divide(10, 0))$q$, NULL, $q$The try block attempts the risky operation. The except clause catches a specific error type and provides a fallback return value. The finally clause always executes — even when a return is reached inside try or except — making it ideal for cleanup or status messages.$q$),
  ($q$H005$q$, $q$hard$q$, $q$oop_basics$q$, $q$write_the_code$q$, $q$Write a class BankAccount with __init__(owner, balance=0), a deposit(amount) method that adds to the balance, and a withdraw(amount) method that subtracts from the balance but raises ValueError("Insufficient funds") if the amount exceeds the balance. Create an account, deposit 100, withdraw 40, and print the balance.$q$, $q$class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("Insufficient funds")
        self.balance -= amount

account = BankAccount("Alice")
account.deposit(100)
account.withdraw(40)
print(account.balance)$q$, NULL, $q$__init__ is the constructor that sets up instance attributes via self. Instance methods receive self as their first argument, which refers to the object being operated on. Raising ValueError with a descriptive message is the standard Python pattern for signalling invalid operations.$q$),
  ($q$H006$q$, $q$hard$q$, $q$oop_inheritance$q$, $q$write_the_code$q$, $q$Write a base class Animal with a method speak() that returns "...". Write a subclass Dog that overrides speak() to return "Woof". Create a Dog instance and print the result of calling speak() on it.$q$, $q$class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "Woof"

dog = Dog()
print(dog.speak())$q$, NULL, $q$Inheritance lets a subclass reuse and extend a parent class. When Dog overrides speak(), calling the method on a Dog instance uses the subclass version, not the parent's. This is method overriding and is central to polymorphism — the same call produces different behavior depending on the object's actual type.$q$),
  ($q$H007$q$, $q$hard$q$, $q$dunder_methods$q$, $q$write_the_code$q$, $q$Write a class Vector with __init__(x, y), an __add__ method that returns a new Vector whose coordinates are the element-wise sum of both vectors, and a __str__ method that returns "Vector(x, y)". Print the result of Vector(1, 2) + Vector(3, 4).$q$, $q$class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __str__(self):
        return f"Vector({self.x}, {self.y})"

print(Vector(1, 2) + Vector(3, 4))$q$, NULL, $q$Dunder methods let you define how your objects behave with built-in operators and functions. __add__ is called when you use the + operator between two instances. __str__ is called by print() and str() to produce a human-readable representation. Both make custom classes feel like native Python types.$q$),
  ($q$H008$q$, $q$hard$q$, $q$itertools$q$, $q$write_the_code$q$, $q$Import itertools.chain and use it to combine [1, 2, 3] and [4, 5, 6] into a single sequence. Print each element on its own line.$q$, $q$from itertools import chain

for item in chain([1, 2, 3], [4, 5, 6]):
    print(item)$q$, NULL, $q$itertools.chain takes multiple iterables and returns an iterator that yields elements from the first, then the second, and so on — without building a new combined list. It is memory-efficient for stitching together sequences that are processed one item at a time.$q$),
  ($q$H009$q$, $q$hard$q$, $q$functools$q$, $q$write_the_code$q$, $q$Use functools.partial and operator.mul to create a function called double that multiplies its argument by 2. Print double(7).$q$, $q$import functools
import operator

double = functools.partial(operator.mul, 2)
print(double(7))$q$, NULL, $q$functools.partial creates a new callable by freezing one or more arguments of an existing function. operator.mul(a, b) is the function form of a * b. Fixing the first argument to 2 produces a one-argument function that always multiplies its input by 2.$q$),
  ($q$H010$q$, $q$hard$q$, $q$closures$q$, $q$write_the_code$q$, $q$Write a factory function make_multiplier(n) that returns an inner function which takes one argument x and returns n * x. Store make_multiplier(3) in a variable triple and print triple(10).$q$, $q$def make_multiplier(n):
    def multiplier(x):
        return n * x
    return multiplier

triple = make_multiplier(3)
print(triple(10))$q$, $q$def make_multiplier(n):
    return lambda x: n * x

triple = make_multiplier(3)
print(triple(10))$q$, $q$A closure is a function that retains access to variables from its enclosing scope, even after the outer function has returned. Here the inner function captures n from make_multiplier's local scope. triple(10) therefore computes 3 * 10 = 30 without needing n to be passed again.$q$),
  ($q$H011$q$, $q$hard$q$, $q$decorators$q$, $q$write_the_code$q$, $q$Write a decorator count_calls that sets a call_count attribute to 0 on the wrapper function and increments it every time the decorated function is called. Apply it to a function greet() that prints "Hello". Call greet() three times and print greet.call_count.$q$, $q$def count_calls(func):
    def wrapper(*args, **kwargs):
        wrapper.call_count += 1
        return func(*args, **kwargs)
    wrapper.call_count = 0
    return wrapper

@count_calls
def greet():
    print("Hello")

greet()
greet()
greet()
print(greet.call_count)$q$, NULL, $q$Functions are objects in Python, so you can set attributes directly on them. The decorator initialises wrapper.call_count = 0 before returning the wrapper. Each call increments it. Because @count_calls replaces greet with wrapper, greet.call_count exposes that counter.$q$),
  ($q$H012$q$, $q$hard$q$, $q$generators$q$, $q$write_the_code$q$, $q$Write a generator expression that produces the squares of numbers from 1 to 10, but only includes a square if it is odd. Print each value produced by the generator on its own line.$q$, $q$gen = (x**2 for x in range(1, 11) if x % 2 != 0)
for value in gen:
    print(value)$q$, $q$for value in (x**2 for x in range(1, 11) if x**2 % 2 != 0):
    print(value)$q$, $q$A generator expression is written like a list comprehension but wrapped in parentheses instead of square brackets. It produces values lazily. Only odd numbers (1, 3, 5, 7, 9) produce odd squares, giving 1, 9, 25, 49, 81. Even numbers squared are always even so the filter x % 2 != 0 excludes them.$q$),
  ($q$H013$q$, $q$hard$q$, $q$error_handling$q$, $q$write_the_code$q$, $q$Define a custom exception class NegativeValueError that inherits from ValueError. Write a function square_root(n) that raises NegativeValueError("Cannot take square root of negative number") when n < 0. Call square_root(-4) inside a try/except block and print the exception message.$q$, $q$class NegativeValueError(ValueError):
    pass

def square_root(n):
    if n < 0:
        raise NegativeValueError("Cannot take square root of negative number")
    return n ** 0.5

try:
    square_root(-4)
except NegativeValueError as e:
    print(e)$q$, NULL, $q$Custom exceptions are created by subclassing a built-in exception. Inheriting from ValueError means callers can catch NegativeValueError specifically or catch the broader ValueError. The exception message is stored as the first argument and accessible via str(e) or e.args[0].$q$),
  ($q$H014$q$, $q$hard$q$, $q$dunder_methods$q$, $q$write_the_code$q$, $q$Write a class Stack backed by a list. Implement push(item), pop(), __len__ (returns the number of items), and __repr__ (returns "Stack([...])"). Push 1, 2, 3 onto a new stack, then print len(stack) and repr(stack).$q$, $q$class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        return self._items.pop()

    def __len__(self):
        return len(self._items)

    def __repr__(self):
        return f"Stack({self._items})"

stack = Stack()
stack.push(1)
stack.push(2)
stack.push(3)
print(len(stack))
print(repr(stack))$q$, NULL, $q$__len__ is called by len() and must return a non-negative integer. __repr__ is called by repr() and the interactive shell — it should return a string that clearly identifies the object's contents. Implementing these dunders makes your class integrate naturally with Python's built-in functions.$q$),
  ($q$H015$q$, $q$hard$q$, $q$decorators$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so the decorator correctly exposes the wrapper to callers:
def decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return ___$q$, $q$wrapper$q$, NULL, $q$A decorator must return a callable so the decorated name points to something that can be invoked. Returning wrapper — the inner function — replaces the original function with the version that adds extra behavior.$q$),
  ($q$H016$q$, $q$hard$q$, $q$decorators$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank to preserve the original function's __name__ and __doc__ inside the decorator:
import functools
def decorator(func):
    @functools.___(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper$q$, $q$wraps$q$, NULL, $q$Without @functools.wraps(func), the decorated function's __name__ and __doc__ become those of wrapper, which breaks introspection and debugging. @functools.wraps(func) copies those attributes from func onto wrapper automatically.$q$),
  ($q$H017$q$, $q$hard$q$, $q$generators$q$, $q$fill_in_the_blank$q$, $q$Fill in the keyword that pauses the function and sends a value to the caller:
def gen():
    for i in range(3):
        ___ i$q$, $q$yield$q$, NULL, $q$yield suspends the generator function's execution, sends the value to the caller, and resumes from the same point on the next call to next(). Unlike return, yield does not end the function — it merely pauses it until the next value is requested.$q$),
  ($q$H018$q$, $q$hard$q$, $q$generators$q$, $q$fill_in_the_blank$q$, $q$Fill in the built-in function that retrieves the next value from a generator object:
g = countdown(3)
print(___(g))$q$, $q$next$q$, NULL, $q$next(iterator) calls the iterator's __next__ method, which resumes the generator until the next yield and returns the yielded value. When the generator is exhausted, next() raises StopIteration — unless you pass a default as the second argument, e.g. next(g, None).$q$),
  ($q$H019$q$, $q$hard$q$, $q$context_managers$q$, $q$fill_in_the_blank$q$, $q$Fill in the dunder method name that is called when Python enters the with block:
class CM:
    def ___(self):
        print("entering")
        return self
    def __exit__(self, *args):
        print("exiting")$q$, $q$__enter__$q$, NULL, $q$The with statement protocol calls __enter__ at the start of the block and __exit__ at the end, regardless of whether an exception occurred. The value returned by __enter__ is bound to the variable after as.$q$),
  ($q$H020$q$, $q$hard$q$, $q$error_handling$q$, $q$fill_in_the_blank$q$, $q$Fill in the variable name that binds the caught exception so it can be inspected:
try:
    risky()
except ValueError as ___:
    print(e)$q$, $q$e$q$, NULL, $q$The as clause in an except statement binds the exception object to a name so you can inspect its message, type, or attributes. By convention e is the standard name, but any valid identifier works. The binding is only in scope inside the except block.$q$),
  ($q$H021$q$, $q$hard$q$, $q$error_handling$q$, $q$fill_in_the_blank$q$, $q$Fill in the clause that always executes regardless of whether an exception occurred:
try:
    open_connection()
except ConnectionError:
    print("failed")
___:
    print("always runs")$q$, $q$finally$q$, NULL, $q$The finally clause runs whether the try block succeeded, raised a caught exception, raised an uncaught exception, or executed a return or break. It is the standard place for cleanup actions like closing files, releasing locks, or printing status.$q$),
  ($q$H022$q$, $q$hard$q$, $q$oop_basics$q$, $q$fill_in_the_blank$q$, $q$Fill in the method name that initialises instance attributes when a new object is created:
class Dog:
    def ___(self, name):
        self.name = name$q$, $q$__init__$q$, NULL, $q$__init__ is the initialiser method called automatically by Python after a new object is allocated. It receives the new instance as self and sets up its initial state. It does not return a value — it only mutates self.$q$),
  ($q$H023$q$, $q$hard$q$, $q$oop_inheritance$q$, $q$fill_in_the_blank$q$, $q$Fill in the built-in call that gives access to the parent class so its __init__ is not skipped:
class Dog(Animal):
    def __init__(self, name):
        ___().__init__(name)
        self.tricks = []$q$, $q$super()$q$, NULL, $q$super() returns a proxy object that delegates method calls to the parent class in the method resolution order. Calling super().__init__(name) runs Animal's __init__ so that the parent's setup is not skipped when the child overrides the method.$q$),
  ($q$H024$q$, $q$hard$q$, $q$dunder_methods$q$, $q$fill_in_the_blank$q$, $q$Fill in the dunder method name so that print(obj) displays a human-readable string:
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def ___(self):
        return f"Point({self.x}, {self.y})"$q$, $q$__str__$q$, NULL, $q$__str__ is called by str() and print() to get a friendly, human-readable representation. __repr__ is the other string dunder, but it targets developers and is used by repr() and the interactive shell. When __str__ is not defined, Python falls back to __repr__.$q$),
  ($q$H025$q$, $q$hard$q$, $q$functools$q$, $q$fill_in_the_blank$q$, $q$Fill in the decorator name that caches return values so repeated calls with the same arguments skip recomputation:
import functools
@functools.___( )
def fib(n):
    if n < 2: return n
    return fib(n - 1) + fib(n - 2)$q$, $q$lru_cache$q$, NULL, $q$functools.lru_cache wraps a function with a Least Recently Used cache. Repeated calls with the same arguments return the cached result immediately. This turns the naive exponential Fibonacci recursion into an O(n) computation by memoising each subproblem.$q$),
  ($q$H026$q$, $q$hard$q$, $q$itertools$q$, $q$fill_in_the_blank$q$, $q$Fill in the function name so the output is [0, 1, 2, 3, 4, 5]:
from itertools import ___
print(list(___(range(3), range(3, 6))))$q$, $q$chain$q$, NULL, $q$itertools.chain takes multiple iterables and returns a single iterator that yields elements from each in sequence. It never builds an intermediate combined list, making it memory-efficient for large sequences.$q$),
  ($q$H027$q$, $q$hard$q$, $q$decorators$q$, $q$output_prediction$q$, $q$What does this code print?
def logger(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print("Done")
        return result
    return wrapper

@logger
def add(a, b):
    return a + b

print(add(2, 3))$q$, $q$Calling add
Done
5$q$, NULL, $q$add(2, 3) actually calls wrapper(2, 3). The wrapper prints "Calling add", calls the original add which returns 5, prints "Done", then returns 5. The outer print() receives that return value and prints 5 on its own line.$q$),
  ($q$H028$q$, $q$hard$q$, $q$generators$q$, $q$output_prediction$q$, $q$What does this code print?
def gen():
    yield 1
    yield 2
    yield 3

g = gen()
print(next(g))
print(next(g))$q$, $q$1
2$q$, NULL, $q$Calling gen() creates the generator object without executing any code. The first next(g) runs until the first yield, producing 1. The second next(g) resumes from after the first yield and runs to the second yield, producing 2. The third yield is never reached.$q$),
  ($q$H029$q$, $q$hard$q$, $q$oop_basics$q$, $q$output_prediction$q$, $q$What does this code print?
class Counter:
    count = 0
    def inc(self):
        Counter.count += 1

a = Counter()
b = Counter()
a.inc()
b.inc()
print(Counter.count)$q$, $q$2$q$, NULL, $q$count is a class variable — it belongs to Counter itself, not to any individual instance. Both a.inc() and b.inc() modify Counter.count directly (not self.count), so both increments affect the same shared value. The final print shows 2.$q$),
  ($q$H030$q$, $q$hard$q$, $q$oop_inheritance$q$, $q$output_prediction$q$, $q$What does this code print?
class A:
    def hello(self):
        return "A"

class B(A):
    def hello(self):
        return "B"

print(B().hello())$q$, $q$B$q$, NULL, $q$B overrides hello() with its own version. When hello() is called on a B instance, Python resolves the method by looking up B's class first. Since B defines hello(), Python uses that version, returning "B" — the parent's implementation is never reached.$q$),
  ($q$H031$q$, $q$hard$q$, $q$dunder_methods$q$, $q$output_prediction$q$, $q$What does this code print?
class N:
    def __init__(self, v):
        self.v = v
    def __add__(self, other):
        return N(self.v + other.v)
    def __str__(self):
        return str(self.v)

print(N(3) + N(4))$q$, $q$7$q$, NULL, $q$N(3) + N(4) triggers __add__, which creates a new N object with v = 3 + 4 = 7. print() then calls __str__ on that object, which returns str(7) = "7". Python prints that string.$q$),
  ($q$H032$q$, $q$hard$q$, $q$error_handling$q$, $q$output_prediction$q$, $q$What does this code print?
try:
    x = 1 / 0
except ZeroDivisionError:
    print("caught")
finally:
    print("done")$q$, $q$caught
done$q$, NULL, $q$1 / 0 raises ZeroDivisionError, which the except clause catches, printing "caught". The finally clause then runs unconditionally, printing "done". Because the exception was handled, execution continues normally after the entire block.$q$),
  ($q$H033$q$, $q$hard$q$, $q$closures$q$, $q$output_prediction$q$, $q$What does this code print?
def outer(x):
    def inner(y):
        return x + y
    return inner

add5 = outer(5)
print(add5(3))$q$, $q$8$q$, NULL, $q$outer(5) creates inner and returns it. At that moment, inner closes over the value x=5 from outer's scope. Calling add5(3) invokes inner(3), which computes 5 + 3 = 8. The variable x is kept alive by the closure even though outer has finished running.$q$),
  ($q$H034$q$, $q$hard$q$, $q$itertools$q$, $q$output_prediction$q$, $q$What does this code print?
from itertools import islice

gen = (x**2 for x in range(100))
print(list(islice(gen, 4)))$q$, $q$[0, 1, 4, 9]$q$, NULL, $q$The generator expression lazily produces squares: 0, 1, 4, 9, 16, ... itertools.islice(gen, 4) takes only the first 4 values without consuming or storing the rest. list() materialises those 4 values into [0, 1, 4, 9].$q$),
  ($q$H035$q$, $q$hard$q$, $q$decorators$q$, $q$spot_the_bug$q$, $q$What does greet.__name__ print after this decorator is applied, and what single line fixes it?
def my_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet():
    """Say hello."""
    print("Hello!")

print(greet.__name__)$q$, $q$wrapper$q$, NULL, $q$Without @functools.wraps(func), the decorated name greet points to wrapper, inheriting wrapper's __name__ and __doc__. The fix is to add @functools.wraps(func) directly above def wrapper(...). This copies the original function's attributes onto wrapper so introspection and debugging tools see the correct name.$q$),
  ($q$H036$q$, $q$hard$q$, $q$generators$q$, $q$spot_the_bug$q$, $q$What error is raised on the 6th iteration, and how do you guard against it?
g = (x for x in range(5))
for _ in range(6):
    print(next(g))$q$, $q$StopIteration$q$, NULL, $q$The generator yields values 0 through 4 (five values). The 6th call to next(g) finds no more values and raises StopIteration. A for-in loop handles this automatically, but calling next() manually does not. Guard against it by passing a sentinel default: next(g, None), which returns None instead of raising when the generator is exhausted.$q$),
  ($q$H037$q$, $q$hard$q$, $q$oop_basics$q$, $q$what_is_the_result$q$, $q$What does this code print, and why is the result surprising?
class Dog:
    tricks = []
    def add_trick(self, t):
        self.tricks.append(t)

a = Dog()
b = Dog()
a.add_trick("roll")
print(b.tricks)$q$, $q$['roll']$q$, NULL, $q$tricks is a class variable — a single list shared by every Dog instance. When a.add_trick("roll") calls self.tricks.append(t), Python looks up tricks on the class (since it is not on the instance) and mutates that shared list in place. b.tricks sees the same object. Fix: initialise self.tricks = [] inside __init__ to give each instance its own list.$q$),
  ($q$H038$q$, $q$hard$q$, $q$oop_inheritance$q$, $q$spot_the_bug$q$, $q$What error does this code raise, and why?
class A:
    def __init__(self):
        self.x = 1

class B(A):
    def __init__(self):
        self.y = 2

b = B()
print(b.x)$q$, $q$AttributeError: 'B' object has no attribute 'x'$q$, NULL, $q$B.__init__ overrides A.__init__ completely without calling super().__init__(). That means A's initialiser never runs, so self.x is never set on the instance. The fix is to add super().__init__() as the first line of B.__init__, which runs the parent's setup before adding B-specific attributes.$q$),
  ($q$H039$q$, $q$hard$q$, $q$error_handling$q$, $q$spot_the_bug$q$, $q$What happens when this code runs?
try:
    raise ValueError("bad input")
except TypeError:
    print("caught")$q$, $q$ValueError propagates uncaught and terminates the program with: ValueError: bad input$q$, NULL, $q$The except clause only catches TypeError. ValueError is not a subclass of TypeError, so Python does not enter the except block. The exception continues propagating up the call stack and crashes the program. Fix by catching ValueError directly, or catching the common base Exception if multiple types are acceptable.$q$),
  ($q$H040$q$, $q$hard$q$, $q$context_managers$q$, $q$spot_the_bug$q$, $q$What error does this code raise?
class Broken:
    def __enter__(self):
        return self

with Broken() as b:
    pass$q$, $q$AttributeError: __exit__$q$, NULL, $q$The with statement protocol requires both __enter__ and __exit__. Python calls __exit__ at the end of every with block to handle cleanup and exception suppression. Since Broken has no __exit__, Python raises AttributeError. Fix by adding def __exit__(self, exc_type, exc_val, exc_tb): return False.$q$),
  ($q$E001$q$, $q$expert$q$, $q$property$q$, $q$write_the_code$q$, $q$Write a class Temperature with a private attribute _celsius. Add a property celsius that returns _celsius, and a setter that raises ValueError("Temperature below -273.15 is not possible") if the value is below -273.15. Create an instance, set celsius to 25, then print it.$q$, $q$class Temperature:
    def __init__(self, celsius=0):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Temperature below -273.15 is not possible")
        self._celsius = value

t = Temperature()
t.celsius = 25
print(t.celsius)$q$, NULL, $q$@property turns a method into a read-only attribute. Pairing it with @<name>.setter allows controlled writes. The setter validates the value before storing it in the private _celsius attribute. Note that self.celsius = celsius in __init__ routes through the setter, so validation runs at construction time too.$q$),
  ($q$E002$q$, $q$expert$q$, $q$classmethod$q$, $q$write_the_code$q$, $q$Write a class Point with __init__(x, y). Add a class method from_string(cls, s) that parses a string in the format "x,y" and returns a new Point. Create a Point from the string "3,4" and print its x and y attributes.$q$, $q$class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    @classmethod
    def from_string(cls, s):
        x, y = s.split(",")
        return cls(int(x), int(y))

p = Point.from_string("3,4")
print(p.x, p.y)$q$, NULL, $q$@classmethod receives the class (cls) as its first argument instead of an instance. This makes it a natural alternative constructor — it builds a new instance from a different input format. Using cls(...) instead of Point(...) ensures that subclasses inherit the constructor correctly.$q$),
  ($q$E003$q$, $q$expert$q$, $q$staticmethod$q$, $q$write_the_code$q$, $q$Write a class MathUtils with a static method is_even(n) that returns True if n is even, False otherwise. Call MathUtils.is_even(4) and MathUtils.is_even(7) and print both results.$q$, $q$class MathUtils:
    @staticmethod
    def is_even(n):
        return n % 2 == 0

print(MathUtils.is_even(4))
print(MathUtils.is_even(7))$q$, NULL, $q$@staticmethod creates a method that belongs to the class namespace but receives neither self nor cls. Use it for utility functions that are logically related to the class but do not need access to instance or class state. They can be called on the class directly, making the intent clear.$q$),
  ($q$E004$q$, $q$expert$q$, $q$dataclasses$q$, $q$write_the_code$q$, $q$Using @dataclass, write a class Product with fields name (str), price (float), and quantity (int) with a default of 1. Create Product("Widget", 9.99) and print it.$q$, $q$from dataclasses import dataclass

@dataclass
class Product:
    name: str
    price: float
    quantity: int = 1

p = Product("Widget", 9.99)
print(p)$q$, NULL, $q$@dataclass auto-generates __init__, __repr__, and __eq__ from the annotated class attributes. Fields with defaults must come after fields without. The generated __repr__ produces a readable string like Product(name='Widget', price=9.99, quantity=1) automatically.$q$),
  ($q$E005$q$, $q$expert$q$, $q$dataclasses$q$, $q$write_the_code$q$, $q$Write a @dataclass class Circle with a field radius (float) using field(default=1.0). Add a __post_init__ method that raises ValueError("Radius must be positive") if radius is not positive. Add a property area that returns math.pi * radius ** 2. Create Circle(3.0) and print its area rounded to 2 decimal places.$q$, $q$import math
from dataclasses import dataclass, field

@dataclass
class Circle:
    radius: float = field(default=1.0)

    def __post_init__(self):
        if self.radius <= 0:
            raise ValueError("Radius must be positive")

    @property
    def area(self):
        return math.pi * self.radius ** 2

c = Circle(3.0)
print(round(c.area, 2))$q$, NULL, $q$field() is used when a default value needs extra configuration metadata. __post_init__ runs automatically after __init__ and is the right place for validation that depends on the fully constructed instance. Adding @property to a dataclass works exactly like a regular class — @dataclass only generates the __init__ plumbing.$q$),
  ($q$E006$q$, $q$expert$q$, $q$__slots__$q$, $q$write_the_code$q$, $q$Write a class Vector2D using __slots__ = ("x", "y") with __init__(x, y). Add a method magnitude() that returns (x**2 + y**2) ** 0.5. Create Vector2D(3, 4) and print its magnitude.$q$, $q$class Vector2D:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def magnitude(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

v = Vector2D(3, 4)
print(v.magnitude())$q$, NULL, $q$__slots__ replaces the per-instance __dict__ with a fixed-size structure, reducing memory usage significantly when many instances are created. The trade-off is that you cannot add new attributes at runtime. Each slot name becomes a descriptor on the class.$q$),
  ($q$E007$q$, $q$expert$q$, $q$advanced_decorators$q$, $q$write_the_code$q$, $q$Write a decorator factory repeat(n) that makes a decorated function run n times. Decorate a function say(msg) that prints the message. Apply @repeat(3) to say and call say("Hi").$q$, $q$def repeat(n):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(n):
                func(*args, **kwargs)
        return wrapper
    return decorator

@repeat(3)
def say(msg):
    print(msg)

say("Hi")$q$, NULL, $q$A parametrized decorator adds an outer factory layer: repeat(n) returns the actual decorator, which returns the wrapper. This gives three levels of nesting — factory -> decorator -> wrapper. The factory captures n in a closure, so the decorator remembers how many times to repeat each call.$q$),
  ($q$E008$q$, $q$expert$q$, $q$advanced_decorators$q$, $q$write_the_code$q$, $q$Write a class-based decorator CallCounter that tracks how many times a decorated function has been called. Store the count in a count attribute and call the original function on each invocation. Decorate a function greet(name) that prints "Hello, <name>". Call it twice, then print greet.count.$q$, $q$class CallCounter:
    def __init__(self, func):
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

@CallCounter
def greet(name):
    print(f"Hello, {name}")

greet("Alice")
greet("Bob")
print(greet.count)$q$, NULL, $q$A class-based decorator implements __init__ (receives the function) and __call__ (invoked on each call). This is cleaner than a closure when the decorator needs mutable state. @CallCounter on greet replaces greet with a CallCounter instance, so greet.count gives direct access to the call counter.$q$),
  ($q$E009$q$, $q$expert$q$, $q$generators$q$, $q$write_the_code$q$, $q$Write a generator function accumulator() that yields the running total of values sent into it. The total starts at 0. Prime the generator with next(), then send the values 10, 20, and 5 one at a time, printing each yielded total.$q$, $q$def accumulator():
    total = 0
    while True:
        value = yield total
        total += value

gen = accumulator()
next(gen)
print(gen.send(10))
print(gen.send(20))
print(gen.send(5))$q$, NULL, $q$send(value) resumes the generator and injects a value that becomes the result of the yield expression. Before send() can pass data, the generator must be advanced to the first yield with next() — this is called priming. Each loop iteration yields the running total, then waits for the next send() call.$q$),
  ($q$E010$q$, $q$expert$q$, $q$generators$q$, $q$write_the_code$q$, $q$Write a generator function chain(*iterables) that yields every item from each iterable in sequence using yield from. Call chain([1, 2], [3, 4], [5]) and print each yielded value on its own line.$q$, $q$def chain(*iterables):
    for iterable in iterables:
        yield from iterable

for value in chain([1, 2], [3, 4], [5]):
    print(value)$q$, NULL, $q$yield from delegates to a sub-iterable, yielding all its items as if they came from the outer generator. It is cleaner than a for loop with yield because it also correctly forwards send(), throw(), and close() calls through to the inner generator — important for coroutine chains.$q$),
  ($q$E011$q$, $q$expert$q$, $q$async_await$q$, $q$write_the_code$q$, $q$Write an async function fetch_data(name) that prints "Fetching <name>...", awaits asyncio.sleep(0), then returns "<name>: done". Write a main() async function that awaits fetch_data("users") and prints the result. Run main() with asyncio.run().$q$, $q$import asyncio

async def fetch_data(name):
    print(f"Fetching {name}...")
    await asyncio.sleep(0)
    return f"{name}: done"

async def main():
    result = await fetch_data("users")
    print(result)

asyncio.run(main())$q$, NULL, $q$async def defines a coroutine. await suspends the current coroutine and gives control to the event loop, which can run other tasks. asyncio.sleep(0) is the minimal yield point — it lets other scheduled coroutines run without actually waiting. asyncio.run() creates a fresh event loop, runs the given coroutine to completion, then closes the loop.$q$),
  ($q$E012$q$, $q$expert$q$, $q$abc$q$, $q$write_the_code$q$, $q$Using abc.ABC and @abstractmethod, write an abstract base class Shape with an abstract method area() that returns a float. Write concrete subclasses Rectangle(width, height) and Circle(radius) that each implement area(). Create one of each and print their areas rounded to 2 decimal places.$q$, $q$from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2

print(round(Rectangle(4, 5).area(), 2))
print(round(Circle(3).area(), 2))$q$, NULL, $q$ABCs enforce a contract: any class that inherits from Shape without implementing area() raises TypeError when instantiated. @abstractmethod marks the method as required. The ABC metaclass handles the enforcement automatically — you do not need custom __init_subclass__ logic.$q$),
  ($q$E013$q$, $q$expert$q$, $q$multiple_inheritance$q$, $q$write_the_code$q$, $q$Write three classes: Flyable with move() returning "Flying", Swimmable with move() returning "Swimming", and Duck that inherits from both (Flyable first). Add a describe() method to Duck that returns "I am a duck that can: " + super().move(). Create a Duck instance and print move() and describe().$q$, $q$class Flyable:
    def move(self):
        return "Flying"

class Swimmable:
    def move(self):
        return "Swimming"

class Duck(Flyable, Swimmable):
    def describe(self):
        return "I am a duck that can: " + super().move()

d = Duck()
print(d.move())
print(d.describe())$q$, NULL, $q$Python's MRO (Method Resolution Order) determines which method is used when multiple parent classes define the same name. For Duck(Flyable, Swimmable) the MRO is Duck -> Flyable -> Swimmable -> object. So both d.move() and super().move() inside Duck resolve to Flyable.move(). Use Duck.__mro__ to inspect the full chain.$q$),
  ($q$E014$q$, $q$expert$q$, $q$type_hints$q$, $q$write_the_code$q$, $q$Write a typed function merge_dicts that accepts two dicts of type dict[str, int] and returns a new dict[str, int] where values for shared keys are summed. Add full type annotations to the parameters and return value. Test it with {"a": 1, "b": 2} and {"b": 3, "c": 4} and print the result.$q$, $q$def merge_dicts(d1: dict[str, int], d2: dict[str, int]) -> dict[str, int]:
    result = dict(d1)
    for key, value in d2.items():
        result[key] = result.get(key, 0) + value
    return result

print(merge_dicts({"a": 1, "b": 2}, {"b": 3, "c": 4}))$q$, NULL, $q$Type hints (PEP 484) annotate parameters and return values with expected types. dict[str, int] is a built-in generic syntax available from Python 3.9+. Hints are not enforced at runtime — they are documentation for readers and checked by static tools like mypy or pyright. dict(d1) copies the first dict to avoid mutating the original.$q$),
  ($q$E015$q$, $q$expert$q$, $q$metaclasses$q$, $q$write_the_code$q$, $q$Write a metaclass UpperCaseMeta that converts all non-dunder attribute names in a class to uppercase when the class is created. Apply it to a class Config that sets debug = True and version = "1.0". Print Config.DEBUG and Config.VERSION.$q$, $q$class UpperCaseMeta(type):
    def __new__(mcs, name, bases, namespace):
        upper_namespace = {}
        for key, value in namespace.items():
            if key.startswith("__"):
                upper_namespace[key] = value
            else:
                upper_namespace[key.upper()] = value
        return super().__new__(mcs, name, bases, upper_namespace)

class Config(metaclass=UpperCaseMeta):
    debug = True
    version = "1.0"

print(Config.DEBUG)
print(Config.VERSION)$q$, NULL, $q$A metaclass controls how a class is created. type is the default metaclass. Overriding __new__ lets you inspect and transform the class namespace before the class object is built. Dunder names are copied as-is while all other names are uppercased. super().__new__() then builds the actual class with the modified namespace.$q$),
  ($q$E016$q$, $q$expert$q$, $q$property$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks to create a read-write property:

class Square:
    def __init__(self, side):
        self._side = side

    @______
    def side(self):
        return self._side

    @side.______
    def side(self, value):
        if value < 0:
            raise ValueError("Side must be non-negative")
        self._side = value$q$, $q$property, setter$q$, NULL, $q$@property makes the method a getter — it can be read like an attribute. @<name>.setter registers a setter for the same property name. If only @property is used, the attribute is read-only and assignment raises AttributeError.$q$),
  ($q$E017$q$, $q$expert$q$, $q$classmethod$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank:

class Celsius:
    def __init__(self, temp):
        self.temp = temp

    @______
    def from_fahrenheit(cls, f):
        return cls((f - 32) * 5 / 9)$q$, $q$classmethod$q$, NULL, $q$@classmethod passes the class as the first argument (cls) instead of the instance. It is the standard way to write alternative constructors. Using cls(...) instead of Celsius(...) ensures that subclasses inherit the factory method correctly.$q$),
  ($q$E018$q$, $q$expert$q$, $q$staticmethod$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so that is_palindrome can be called without creating an instance:

class StringUtils:
    @______
    def is_palindrome(s):
        return s == s[::-1]$q$, $q$staticmethod$q$, NULL, $q$@staticmethod removes both self and cls from the signature. It is a plain function grouped inside the class for organisational purposes. It can be called as StringUtils.is_palindrome("racecar") or on an instance — either way, no class or instance is passed automatically.$q$),
  ($q$E019$q$, $q$expert$q$, $q$dataclasses$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks:

from dataclasses import ______

@______
class Employee:
    name: str
    department: str
    salary: float = 50000.0$q$, $q$dataclass, dataclass$q$, NULL, $q$dataclass is imported from the dataclasses module and used both as the import name and the decorator. @dataclass inspects annotated class attributes and auto-generates __init__, __repr__, and __eq__. Fields with defaults (salary) must be declared after fields without defaults.$q$),
  ($q$E020$q$, $q$expert$q$, $q$__slots__$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank so that instances use a fixed memory layout instead of a per-instance __dict__:

class Node:
    ______ = ("value", "next_node")

    def __init__(self, value):
        self.value = value
        self.next_node = None$q$, $q$__slots__$q$, NULL, $q$Setting __slots__ to a tuple of attribute names tells Python to allocate a fixed-size structure instead of a per-instance __dict__. This reduces memory usage significantly when thousands of instances are created, as in a linked list. Only the declared slot names can be stored as attributes.$q$),
  ($q$E021$q$, $q$expert$q$, $q$advanced_decorators$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks:

def retry(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(______):
                try:
                    return func(*args, **kwargs)
                except Exception:
                    if attempt == times - 1:
                        raise
        return wrapper
    return ______$q$, $q$times, decorator$q$, NULL, $q$The outer function retry(times) is the factory — it captures times and returns the real decorator. The loop retries up to times times. On the last attempt, the exception is re-raised so it propagates to the caller. The factory must return decorator (not wrapper), because the decorator still needs to wrap the function.$q$),
  ($q$E022$q$, $q$expert$q$, $q$generators$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks:

def echo():
    while True:
        received = ______
        print(f"Got: {received}")

gen = echo()
next(gen)
gen.______(42)$q$, $q$yield, send$q$, NULL, $q$received = yield pauses the generator and makes the yielded value available to the caller. When send(42) is called, 42 becomes the value of the yield expression and is assigned to received. The generator must be primed with next() first — before the first yield is reached, send() cannot inject a value.$q$),
  ($q$E023$q$, $q$expert$q$, $q$generators$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank to recursively flatten a nested list:

def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            ______ flatten(item)
        else:
            yield item$q$, $q$yield from$q$, NULL, $q$yield from <generator> delegates iteration to the sub-generator, forwarding all its yielded values to the outer caller. Here, flatten(item) returns a generator for the sub-list, and yield from streams all its items outward. Without yield from you would need an explicit for loop with yield.$q$),
  ($q$E024$q$, $q$expert$q$, $q$async_await$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks:

import asyncio

async def hello():
    ______ asyncio.sleep(1)
    print("Hello after 1 second")

asyncio.______(hello())$q$, $q$await, run$q$, NULL, $q$await suspends the coroutine and yields control to the event loop until the awaited coroutine completes. asyncio.run() is the entry point that creates an event loop, runs the given coroutine to completion, and then closes the loop. It should only be called once at the top level of your program.$q$),
  ($q$E025$q$, $q$expert$q$, $q$abc$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks:

from abc import ABC, ______

class Vehicle(ABC):
    @______
    def fuel_type(self) -> str:
        pass$q$, $q$abstractmethod, abstractmethod$q$, NULL, $q$abstractmethod is imported from abc and used as both the import name and the decorator. Applying @abstractmethod marks a method as required — any concrete subclass that does not implement it will raise TypeError when instantiated. The ABC base class activates this enforcement.$q$),
  ($q$E026$q$, $q$expert$q$, $q$multiple_inheritance$q$, $q$fill_in_the_blank$q$, $q$Fill in the blank using the recommended Python 3 style:

class A:
    def greet(self):
        return "Hello from A"

class B(A):
    def greet(self):
        return ______.greet() + " and B"$q$, $q$super()$q$, NULL, $q$super() returns a proxy object that delegates method calls to the next class in the MRO. In Python 3, super() without arguments automatically uses the enclosing class (B) and the current instance (self). This is cleaner and less error-prone than the Python 2 style super(B, self), and it supports cooperative multiple inheritance correctly.$q$),
  ($q$E027$q$, $q$expert$q$, $q$type_hints$q$, $q$fill_in_the_blank$q$, $q$Fill in the two blanks to express that the return value is either a string or None:

from typing import ______

def find_user(user_id: int) -> ______[str]:
    if user_id == 1:
        return "Alice"
    return None$q$, $q$Optional, Optional$q$, NULL, $q$Optional[str] from the typing module means the value can be str or None — it is shorthand for Union[str, None]. In Python 3.10+ you can write str | None directly without importing anything. Optional is particularly useful for functions that may not always find a result.$q$),
  ($q$E028$q$, $q$expert$q$, $q$property$q$, $q$output_prediction$q$, $q$What is the output?

class Temp:
    def __init__(self, c):
        self.celsius = c

    @property
    def celsius(self):
        return self._c

    @celsius.setter
    def celsius(self, v):
        self._c = v
        print(f"Set to {v}")

t = Temp(20)
t.celsius = 35
print(t.celsius)$q$, $q$Set to 20
Set to 35
35$q$, NULL, $q$self.celsius = c inside __init__ routes through the property setter, not direct attribute assignment. So "Set to 20" prints during construction. Then t.celsius = 35 also calls the setter, printing "Set to 35". Finally, print(t.celsius) calls the getter and prints 35.$q$),
  ($q$E029$q$, $q$expert$q$, $q$classmethod_staticmethod$q$, $q$output_prediction$q$, $q$What is the output?

class Counter:
    count = 0

    @classmethod
    def increment(cls):
        cls.count += 1

    @staticmethod
    def reset(obj):
        obj.count = 0

Counter.increment()
Counter.increment()
print(Counter.count)
Counter.reset(Counter)
print(Counter.count)$q$, $q$2
0$q$, NULL, $q$increment() is a classmethod — cls.count += 1 modifies the class attribute. After two calls, Counter.count is 2. reset() is a staticmethod that accepts an explicit object and sets its count to 0. Passing Counter resets the class attribute to 0. Both values are then printed.$q$),
  ($q$E030$q$, $q$expert$q$, $q$multiple_inheritance$q$, $q$output_prediction$q$, $q$What is the output?

class X:
    def hello(self):
        print("X")

class Y(X):
    def hello(self):
        super().hello()
        print("Y")

class Z(Y):
    def hello(self):
        super().hello()
        print("Z")

Z().hello()$q$, $q$X
Y
Z$q$, NULL, $q$Z().hello() calls super().hello() which is Y.hello(). Y.hello() calls super().hello() which is X.hello(), printing "X". Execution returns to Y.hello() which prints "Y". Execution returns to Z.hello() which prints "Z". The MRO is Z -> Y -> X -> object, and super() follows it in sequence.$q$),
  ($q$E031$q$, $q$expert$q$, $q$generators$q$, $q$output_prediction$q$, $q$What is the output?

def counter():
    n = 0
    while True:
        step = yield n
        n += step if step is not None else 1

gen = counter()
print(next(gen))
print(next(gen))
print(gen.send(5))
print(next(gen))$q$, $q$0
1
6
7$q$, NULL, $q$next(gen) primes and yields 0. next(gen) sends None so step is None, n += 1 = 1, yields 1. gen.send(5) sends step=5, n = 1+5 = 6, yields 6. next(gen) sends None so step is None, n += 1 = 7, yields 7.$q$),
  ($q$E032$q$, $q$expert$q$, $q$dataclasses$q$, $q$output_prediction$q$, $q$What is the output?

from dataclasses import dataclass

@dataclass
class Book:
    title: str
    pages: int
    in_print: bool = True

print(Book("Dune", 412))$q$, $q$Book(title='Dune', pages=412, in_print=True)$q$, NULL, $q$@dataclass auto-generates __repr__ that includes all fields with their values. The format is ClassName(field1=value1, field2=value2, ...). String values are quoted, booleans appear as True/False. The default value for in_print is included because it is part of the instance state.$q$),
  ($q$E033$q$, $q$expert$q$, $q$async_await$q$, $q$output_prediction$q$, $q$What is the output?

import asyncio

async def task(name):
    await asyncio.sleep(0)
    return name.upper()

async def main():
    results = await asyncio.gather(task("alpha"), task("beta"))
    for r in results:
        print(r)

asyncio.run(main())$q$, $q$ALPHA
BETA$q$, NULL, $q$asyncio.gather() runs coroutines concurrently and returns a list of results in the same order as the input coroutines, regardless of completion order. Both tasks sleep for 0 seconds (a yield point only), then return their uppercased name. Results are printed in input order: ALPHA then BETA.$q$),
  ($q$E034$q$, $q$expert$q$, $q$advanced_decorators$q$, $q$output_prediction$q$, $q$What is the output?

def tag(name):
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            return f"<{name}>{result}</{name}>"
        return wrapper
    return decorator

@tag("b")
@tag("i")
def text():
    return "hello"

print(text())$q$, $q$<b><i>hello</i></b>$q$, NULL, $q$Decorators are applied bottom-up: @tag("i") is applied first, wrapping text() to produce <i>hello</i>. Then @tag("b") wraps that to produce <b><i>hello</i></b>. This is equivalent to text = tag("b")(tag("i")(text)).$q$),
  ($q$E035$q$, $q$expert$q$, $q$property$q$, $q$spot_the_bug$q$, $q$This code raises an AttributeError. Find and fix the bug.

class Box:
    @property
    def width(self):
        return self._width

b = Box()
b.width = 10
print(b.width)$q$, $q$class Box:
    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        self._width = value

b = Box()
b.width = 10
print(b.width)$q$, NULL, $q$A property without a setter is read-only. Trying to assign to it raises AttributeError: can't set attribute. The fix is to add a @width.setter method that writes the value to the backing private attribute _width.$q$),
  ($q$E036$q$, $q$expert$q$, $q$multiple_inheritance$q$, $q$spot_the_bug$q$, $q$D().hello() should print "A", "B", then "C", but only "A" is printed. Find and fix the bug.

class A:
    def hello(self):
        print("A")

class B(A):
    def hello(self):
        A.hello(self)
        print("B")

class C(A):
    def hello(self):
        A.hello(self)
        print("C")

class D(B, C):
    def hello(self):
        super().hello()$q$, $q$class A:
    def hello(self):
        print("A")

class B(A):
    def hello(self):
        super().hello()
        print("B")

class C(A):
    def hello(self):
        super().hello()
        print("C")

class D(B, C):
    def hello(self):
        super().hello()$q$, NULL, $q$The MRO for D is D -> B -> C -> A -> object. Hard-coding A.hello(self) in B skips C entirely and calls A twice. Using super() in B and C follows the MRO cooperatively: D calls B, B calls C via super(), C calls A via super(). All three print statements fire in the correct order.$q$),
  ($q$E037$q$, $q$expert$q$, $q$dataclasses$q$, $q$spot_the_bug$q$, $q$This code raises a ValueError from dataclasses. Find and fix the bug.

from dataclasses import dataclass
from typing import List

@dataclass
class Playlist:
    name: str
    tracks: List[str] = []$q$, $q$from dataclasses import dataclass, field
from typing import List

@dataclass
class Playlist:
    name: str
    tracks: List[str] = field(default_factory=list)$q$, NULL, $q$Mutable defaults (lists, dicts, sets) are forbidden in dataclasses because the same object would be shared across all instances — the classic Python mutable-default footgun. The fix is default_factory=list, which calls list() to create a fresh list for each new Playlist instance.$q$),
  ($q$E038$q$, $q$expert$q$, $q$__slots__$q$, $q$what_is_the_result$q$, $q$What happens when this code runs, and why?

class Pixel:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Pixel(1, 2)
p.color = "red"$q$, $q$Raises AttributeError: 'Pixel' object has no attribute 'color'$q$, NULL, $q$__slots__ removes the per-instance __dict__, so only the declared slots (x and y) can be stored as instance attributes. Attempting to set any other attribute raises AttributeError. To allow arbitrary attributes alongside slots, you can include "__dict__" in the __slots__ tuple.$q$),
  ($q$E039$q$, $q$expert$q$, $q$async_await$q$, $q$spot_the_bug$q$, $q$This async function prints a coroutine object instead of "Alice". Find and fix the bug.

import asyncio

async def get_name():
    return "Alice"

async def main():
    name = get_name()
    print(name)

asyncio.run(main())$q$, $q$import asyncio

async def get_name():
    return "Alice"

async def main():
    name = await get_name()
    print(name)

asyncio.run(main())$q$, NULL, $q$Calling an async function without await does not run it — it returns a coroutine object. You must await the coroutine to execute it and get its return value. Without await, name holds something like <coroutine object get_name at 0x...> and Python emits a RuntimeWarning: coroutine 'get_name' was never awaited.$q$),
  ($q$E040$q$, $q$expert$q$, $q$metaclasses$q$, $q$what_is_the_result$q$, $q$What is the output of this code?

class Meta(type):
    def __new__(mcs, name, bases, namespace):
        namespace["created_by"] = "Meta"
        return super().__new__(mcs, name, bases, namespace)

class MyClass(metaclass=Meta):
    pass

print(MyClass.created_by)
print(type(MyClass))$q$, $q$Meta
<class '__main__.Meta'>$q$, NULL, $q$Meta.__new__ is called when MyClass is being built. It injects created_by into the class namespace before construction, so MyClass.created_by == "Meta". type(MyClass) returns the metaclass of MyClass, which is Meta — not the built-in type — because metaclass=Meta was specified. Metaclasses are classes of classes.$q$)
ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier, topic = EXCLUDED.topic, type = EXCLUDED.type,
  question = EXCLUDED.question, answer = EXCLUDED.answer,
  alternative_answer = EXCLUDED.alternative_answer, explanation = EXCLUDED.explanation;
